
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const backupPath = path.join(__dirname, "../prisma/data-backup.json");
const reportPath = path.join(__dirname, "migration-dry-run-report.json");

const decisions = {
  services: "match",
  admins: "neon-only",
  primaryEmail: "maavaishnovideofilm@gmail.com",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function compareBySlug(sqliteRows, neonRows) {
  const neonSlugs = new Set(neonRows.map(x => normalize(x.slug)));

  return sqliteRows.map(row => ({
    id: row.id,
    name: row.name || row.title,
    slug: row.slug,
    classification: neonSlugs.has(normalize(row.slug))
      ? "MATCH"
      : "NEW_CANDIDATE",
  }));
}

async function main() {
  if (!fs.existsSync(backupPath)) {
    throw new Error("SQLite backup JSON not found.");
  }

  const sqlite = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  // Read-only Neon queries
  const [
    neonProducts,
    neonCategories,
    neonPhotography,
    neonCyberCafe,
    neonSettings,
    neonAdmin,
    neonAuditLogs,
    neonTestimonials,
    neonGallery,
    neonSlides,
    neonContactMessages,
  ] = await Promise.all([
    prisma.product.findMany(),
    prisma.productCategory.findMany(),
    prisma.photographyService.findMany(),
    prisma.cyberCafeService.findMany(),
    prisma.settings.findMany(),
    prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.auditLog.findMany(),
    prisma.testimonial.findMany(),
    prisma.gallery.findMany(),
    prisma.homepageSlide.findMany(),
    prisma.contactMessage.findMany(),
  ]);

  const productSlugs = new Set(neonProducts.map(x => normalize(x.slug)));

  const productReport = (sqlite.products || []).map(row => {
    const sameSlug = productSlugs.has(normalize(row.slug));

    const possibleSemanticMatch = neonProducts.some(
      p =>
        normalize(p.name).includes("magic mug") &&
        normalize(row.name).includes("magic")
    );

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      classification: sameSlug
        ? "SLUG_CONFLICT"
        : possibleSemanticMatch
          ? "POSSIBLE_SEMANTIC_MATCH_REVIEW"
          : "NEW_CANDIDATE",
    };
  });

  const categoryReport = compareBySlug(
    sqlite.categories || [],
    neonCategories
  );

  const photographyReport = (sqlite.services || [])
    .filter(s => normalize(s.category) === "photography" ||
                 normalize(s.category) === "videography")
    .map(s => {
      const match = neonPhotography.find(
        n => normalize(n.title) === normalize(s.title) ||
             normalize(n.slug.replace(/-/g, " ")) ===
             normalize(s.title.replace(/-/g, " "))
      );

      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        classification: match ? "MATCH_CANDIDATE" : "NEW_CANDIDATE",
        matchedNeonId: match?.id || null,
      };
    });

  const cyberCafeReport = (sqlite.services || [])
    .filter(s => normalize(s.category) === "cybercafe")
    .map(s => {
      const match = neonCyberCafe.find(
        n => normalize(n.title) === normalize(s.title) ||
             normalize(n.slug) === normalize(s.slug)
      );

      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        classification: match ? "MATCH_CANDIDATE" : "NEW_CANDIDATE",
        matchedNeonId: match?.id || null,
      };
    });

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "READ_ONLY_DRY_RUN",
    productionWritesPerformed: false,
    decisions,

    sqliteCounts: Object.fromEntries(
      Object.entries(sqlite).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.length : 0,
      ])
    ),

    neonCounts: {
      products: neonProducts.length,
      categories: neonCategories.length,
      photographyServices: neonPhotography.length,
      cyberCafeServices: neonCyberCafe.length,
      settings: neonSettings.length,
      admins: neonAdmin.length,
      auditLogs: neonAuditLogs.length,
      testimonials: neonTestimonials.length,
      gallery: neonGallery.length,
      homepageSlides: neonSlides.length,
      contactMessages: neonContactMessages.length,
    },

    products: productReport,
    categories: categoryReport,
    photographyAndVideography: photographyReport,
    cyberCafeServices: cyberCafeReport,

    admin: {
      sqliteAdminCount: (sqlite.adminUsers || []).length,
      neonAdminCount: neonAdmin.length,
      action: "SKIP_SQLITE_ADMIN_IMPORT",
    },

    settings: {
      sqliteSettingsCount: (sqlite.siteSettings || []).length,
      neonSettingsCount: neonSettings.length,
      primaryEmail: decisions.primaryEmail,
      action: "FIELD_LEVEL_REVIEW_ONLY",
    },

    preservation: {
      productImages: (sqlite.productImages || []).length,
      productVariants: (sqlite.productVariants || []).length,
      portfolioProjects: (sqlite.portfolioProjects || []).length,
      portfolioImages: (sqlite.portfolioImages || []).length,
      inquiries: (sqlite.inquiries || []).length,
      adminAuditLogs: (sqlite.adminAuditLogs || []).length,
    },

    warnings: [
      "No production database writes were performed.",
      "Product semantic matches require manual confirmation.",
      "Product variants need a compatible storage model.",
      "Portfolio projects and images need dedicated models.",
      "SQLite admin records are excluded from active import.",
      "Service matching requires manual review of field differences.",
      "Local upload files require separate Cloudflare R2 migration.",
      "Prisma migration history must be reconciled before production migration."
    ],
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\nDRY-RUN COMPLETED");
  console.log("Production writes: NONE");
  console.log("Report:", reportPath);
  console.log("SQLite products:", productReport.length);
  console.log("SQLite categories:", categoryReport.length);
  console.log("Photography/Videography:", photographyReport.length);
  console.log("CyberCafe services:", cyberCafeReport.length);
}

main()
  .catch(error => {
    console.error("DRY-RUN FAILED:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
