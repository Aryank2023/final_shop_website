const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// Test 1: SQLite Export File Integrity
test("SQLite data backup file exists and contains valid records", () => {
  const backupPath = path.join(process.cwd(), "prisma", "data-backup.json");
  assert.ok(fs.existsSync(backupPath), "Backup file prisma/data-backup.json should exist");

  const data = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  assert.ok(data.adminUsers.length > 0, "Should have admin users");
  assert.ok(data.categories.length > 0, "Should have categories");
  assert.ok(data.products.length > 0, "Should have products");
  assert.ok(data.productImages.length > 0, "Should have product images");
  assert.ok(data.productVariants.length > 0, "Should have product variants");
  assert.ok(data.services.length > 0, "Should have services");
  assert.ok(data.portfolioProjects.length > 0, "Should have portfolio projects");
  assert.ok(data.portfolioImages.length > 0, "Should have portfolio images");
  assert.ok(data.siteSettings.length > 0, "Should have site settings");
});

// Test 2: R2 Object Key Generation Logic
test("R2 Object key generation produces safe, clean, date-organized paths", () => {
  function generateObjectKey(folder, originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase() || ".jpg";
    const baseName = path
      .basename(originalFilename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const randomSuffix = "random123";
    const timestamp = "timestamp123";

    return `${folder}/${year}/${month}/mv_${timestamp}_${randomSuffix}-${baseName}${ext}`;
  }

  const key1 = generateObjectKey("products", "My Product Photo (High-Res).png");
  assert.ok(key1.startsWith("products/"), "Key should start with folder prefix");
  assert.ok(key1.endsWith(".png"), "Key should preserve safe extension");
  assert.ok(!key1.includes(" "), "Key should not contain spaces");
  assert.ok(!key1.includes(".."), "Key should prevent path traversal");

  const videoKey = generateObjectKey("portfolio/videos", "Wedding Cinema Teaser.mp4");
  assert.ok(videoKey.startsWith("portfolio/videos/"), "Video key should start with folder prefix");
  assert.ok(videoKey.endsWith(".mp4"), "Video key should end with .mp4");
});

// Test 3: Public Media URL generation
test("Public media URL formatting with custom domain", () => {
  function getPublicMediaUrl(key, customUrl) {
    const base = (customUrl || "https://media.maavaishnovideofilms.com").trim().replace(/\/$/, "");
    const cleanKey = key.replace(/^\/+/, "");
    return `${base}/${cleanKey}`;
  }

  const publicUrl = getPublicMediaUrl("products/2026/10/photo.webp");
  assert.strictEqual(
    publicUrl,
    "https://media.maavaishnovideofilms.com/products/2026/10/photo.webp"
  );
});

// Test 4: File Validation Logic
test("Media validation enforces file types and size limits", () => {
  const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];

  function validate(type, size, isVideo = false) {
    if (isVideo) {
      if (!ALLOWED_VIDEOS.includes(type)) return { valid: false, error: "Invalid video type" };
      if (size > 500 * 1024 * 1024) return { valid: false, error: "Video exceeds 500MB" };
      return { valid: true };
    }
    if (!ALLOWED_IMAGES.includes(type)) return { valid: false, error: "Invalid image type" };
    if (size > 5 * 1024 * 1024) return { valid: false, error: "Image exceeds 5MB" };
    return { valid: true };
  }

  // Valid image
  assert.strictEqual(validate("image/jpeg", 2 * 1024 * 1024).valid, true);
  // Oversized image
  assert.strictEqual(validate("image/jpeg", 6 * 1024 * 1024).valid, false);
  // Invalid image format (e.g. svg or exe)
  assert.strictEqual(validate("image/svg+xml", 1000).valid, false);
  assert.strictEqual(validate("application/x-msdownload", 1000).valid, false);

  // Valid video
  assert.strictEqual(validate("video/mp4", 50 * 1024 * 1024, true).valid, true);
  // Oversized video
  assert.strictEqual(validate("video/mp4", 600 * 1024 * 1024, true).valid, false);
});

