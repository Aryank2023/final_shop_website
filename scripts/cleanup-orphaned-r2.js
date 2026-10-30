const { PrismaClient } = require("@prisma/client");
const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

async function cleanupOrphanedR2Files() {
  const isDeleteMode = process.argv.includes("--delete");

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error("ERROR: Cloudflare R2 credentials missing in environment variables.");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const prisma = new PrismaClient();

  try {
    console.log("Scanning database for all referenced media keys...");

    const [productImages, portfolioImages, portfolioProjects, mediaAssets] = await Promise.all([
      prisma.productImage.findMany({ where: { key: { not: null } }, select: { key: true } }),
      prisma.portfolioImage.findMany({ where: { key: { not: null } }, select: { key: true } }),
      prisma.portfolioProject.findMany({ where: { videoKey: { not: null } }, select: { videoKey: true } }),
      prisma.mediaAsset.findMany({ select: { objectKey: true } }),
    ]);

    const activeKeys = new Set([
      ...productImages.map((i) => i.key),
      ...portfolioImages.map((i) => i.key),
      ...portfolioProjects.map((p) => p.videoKey),
      ...mediaAssets.map((m) => m.objectKey),
    ]);

    console.log(`Found ${activeKeys.size} distinct active keys referenced in database.`);

    console.log(`Listing objects in R2 bucket "${bucket}"...`);
    let continuationToken = undefined;
    const orphanedObjects = [];
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });

      const res = await s3.send(command);
      const contents = res.Contents || [];

      for (const item of contents) {
        if (!item.Key) continue;

        // Only manage keys managed by this application
        if (item.Key.startsWith("products/") || item.Key.startsWith("portfolio/")) {
          const isReferenced = activeKeys.has(item.Key);
          const isOlderThanTwoHours = item.LastModified
            ? new Date(item.LastModified).getTime() < twoHoursAgo
            : true;

          if (!isReferenced && isOlderThanTwoHours) {
            orphanedObjects.push({
              key: item.Key,
              size: item.Size || 0,
              lastModified: item.LastModified,
            });
          }
        }
      }

      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    console.log(`Found ${orphanedObjects.length} orphaned objects in R2.`);

    const totalBytes = orphanedObjects.reduce((acc, obj) => acc + obj.size, 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
    console.log(`Total storage occupied by orphaned files: ${totalMb} MB`);

    if (orphanedObjects.length === 0) {
      console.log("Bucket is clean! No orphaned files found.");
      return;
    }

    if (!isDeleteMode) {
      console.log("\n[DRY RUN MODE] The following files were identified as orphaned:");
      orphanedObjects.slice(0, 20).forEach((obj) => console.log(` - ${obj.key} (${(obj.size / 1024).toFixed(1)} KB)`));
      if (orphanedObjects.length > 20) {
        console.log(` ... and ${orphanedObjects.length - 20} more files.`);
      }
      console.log("\nTo actually delete these files, run:\n  node scripts/cleanup-orphaned-r2.js --delete");
    } else {
      console.log("\n[DELETE MODE] Deleting orphaned objects...");
      let deletedCount = 0;
      for (const obj of orphanedObjects) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.key }));
          deletedCount++;
        } catch (delErr) {
          console.warn(`Failed to delete "${obj.key}":`, delErr.message);
        }
      }
      console.log(`Successfully deleted ${deletedCount} orphaned objects, freeing ${totalMb} MB.`);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedR2Files();
