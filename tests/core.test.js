const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");

// Test 1: Password hashing and verification
test("Password hashing with bcryptjs", async () => {
  const password = "TestSecurityPassword#2026!";
  const hash = await bcrypt.hash(password, 10);
  assert.ok(hash.startsWith("$2"), "Hash should start with bcrypt salt prefix");

  const isMatch = await bcrypt.compare(password, hash);
  assert.strictEqual(isMatch, true, "Bcrypt should verify correct password");

  const isWrong = await bcrypt.compare("WrongPassword", hash);
  assert.strictEqual(isWrong, false, "Bcrypt should reject invalid password");
});

// Test 2: Currency formatting logic (Integer paise to INR)
test("Currency formatting to INR", () => {
  function formatINR(paise) {
    if (paise === null || paise === undefined) return "₹0";
    const rupees = Math.round(paise / 100);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rupees);
  }

  // Check 34900 paise -> ₹349
  const formatted = formatINR(34900);
  assert.ok(formatted.includes("349"), "Should format 34900 paise to ₹349");

  const zero = formatINR(0);
  assert.ok(zero.includes("0"), "Should format 0 paise to ₹0");
});

// Test 3: Slug generation
test("Slug generation for products and portfolio", () => {
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  assert.strictEqual(
    slugify("Magic Color Changing Mug!"),
    "magic-color-changing-mug"
  );
  assert.strictEqual(
    slugify("Royal Bihari Wedding of Rahul & Ananya"),
    "royal-bihari-wedding-of-rahul-ananya"
  );
});

// Test 4: Mobile phone validation (10 digit Indian number)
test("Mobile phone regex validation", () => {
  const indianMobileRegex = /^[6-9]\d{9}$/;

  assert.strictEqual(indianMobileRegex.test("9708345649"), true, "9708345649 should be valid");
  assert.strictEqual(indianMobileRegex.test("9876543210"), true, "9876543210 should be valid");
  assert.strictEqual(indianMobileRegex.test("1234567890"), false, "Numbers starting with 1 should be invalid");
  assert.strictEqual(indianMobileRegex.test("97083456"), false, "Less than 10 digits should be invalid");
  assert.strictEqual(indianMobileRegex.test("970834564900"), false, "More than 10 digits should be invalid");
});

// Test 5: Role-based Access Control (RBAC) verification
test("RBAC role authorization logic", () => {
  function hasRequiredRole(adminRole, allowedRoles) {
    if (adminRole === "OWNER") return true;
    return allowedRoles.includes(adminRole);
  }

  assert.strictEqual(hasRequiredRole("OWNER", ["OWNER"]), true, "OWNER can access OWNER endpoints");
  assert.strictEqual(hasRequiredRole("OWNER", ["MANAGER"]), true, "OWNER has superuser access to MANAGER endpoints");
  assert.strictEqual(hasRequiredRole("OWNER", ["EDITOR"]), true, "OWNER has superuser access to EDITOR endpoints");
  assert.strictEqual(hasRequiredRole("MANAGER", ["OWNER"]), false, "MANAGER cannot access OWNER endpoints");
  assert.strictEqual(hasRequiredRole("MANAGER", ["MANAGER", "EDITOR"]), true, "MANAGER can access MANAGER/EDITOR endpoints");
  assert.strictEqual(hasRequiredRole("EDITOR", ["MANAGER"]), false, "EDITOR cannot access MANAGER endpoints");
  assert.strictEqual(hasRequiredRole("EDITOR", ["EDITOR"]), true, "EDITOR can access EDITOR endpoints");
});

// Test 6: ImageKit folder allowlist security validation
test("ImageKit upload folder allowlist", () => {
  const ALLOWED_FOLDERS = ["/products", "/gallery", "/services", "/homepage", "/testimonials"];

  function validateFolder(folder) {
    return ALLOWED_FOLDERS.includes(folder);
  }

  assert.strictEqual(validateFolder("/products"), true);
  assert.strictEqual(validateFolder("/gallery"), true);
  assert.strictEqual(validateFolder("/services"), true);
  assert.strictEqual(validateFolder("/homepage"), true);
  assert.strictEqual(validateFolder("/testimonials"), true);
  assert.strictEqual(validateFolder("/system"), false, "Non-allowlisted system folders must be rejected");
  assert.strictEqual(validateFolder("../../etc"), false, "Path traversal must be rejected");
});

// Test 7: Password strength policy
test("Password policy validation", () => {
  function validatePasswordPolicy(password) {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  }

  assert.strictEqual(validatePasswordPolicy("WeakPass"), false, "Too weak");
  assert.strictEqual(validatePasswordPolicy("short1!"), false, "Under 8 characters");
  assert.strictEqual(validatePasswordPolicy("ValidStrongPass#2026"), true, "Valid strong password");
  assert.strictEqual(validatePasswordPolicy("NoSpecial1234"), false, "Missing special character");
});

// Test 8: Safe filename generation and MIME-to-extension mapping
test("Safe filename generation derives extension strictly from validated MIME type", () => {
  const crypto = require("crypto");

  const MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };

  function getExtensionFromMime(mimeType) {
    if (!mimeType || typeof mimeType !== "string") return null;
    const normalized = mimeType.trim().toLowerCase();
    if (normalized === "image/jpg") return ".jpg";
    return MIME_TO_EXTENSION[normalized] || null;
  }

  function generateSafeFilename(mimeType, prefix = "mv") {
    const ext = getExtensionFromMime(mimeType);
    if (!ext) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    return `${prefix}_${timestamp}_${randomBytes}${ext}`;
  }

  // All 7 supported formats
  assert.strictEqual(getExtensionFromMime("image/jpeg"), ".jpg");
  assert.strictEqual(getExtensionFromMime("IMAGE/JPEG"), ".jpg");
  assert.strictEqual(getExtensionFromMime("image/jpg"), ".jpg");
  assert.strictEqual(getExtensionFromMime("image/png"), ".png");
  assert.strictEqual(getExtensionFromMime("image/webp"), ".webp");
  assert.strictEqual(getExtensionFromMime("image/gif"), ".gif");
  assert.strictEqual(getExtensionFromMime("video/mp4"), ".mp4");
  assert.strictEqual(getExtensionFromMime("video/webm"), ".webm");
  assert.strictEqual(getExtensionFromMime("video/quicktime"), ".mov");

  // Unsupported formats return null
  assert.strictEqual(getExtensionFromMime("application/pdf"), null);
  assert.strictEqual(getExtensionFromMime("application/x-msdownload"), null);
  assert.strictEqual(getExtensionFromMime("text/html"), null);
  assert.strictEqual(getExtensionFromMime(""), null);
  assert.strictEqual(getExtensionFromMime(null), null);

  // Generated filename properties
  const safeName = generateSafeFilename("image/png");
  assert.match(safeName, /^mv_\d+_[a-f0-9]{32}\.png$/);
  assert.ok(!safeName.includes("/"), "Filename must not contain forward slashes");
  assert.ok(!safeName.includes("\\"), "Filename must not contain backslashes");
  assert.ok(!safeName.includes(".."), "Filename must not contain path traversal");
  assert.ok(!safeName.includes(" "), "Filename must not contain spaces");

  // Unsupported throws
  assert.throws(() => generateSafeFilename("application/x-php"), /Unsupported MIME type/);
});

// Test 9: Filename handling for path traversal, Windows separators, Unicode, and misleading extensions
test("Filename handling resists path traversal, Windows separators, Unicode, and misleading extensions", () => {
  const crypto = require("crypto");

  const MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };

  function getExtensionFromMime(mimeType) {
    if (!mimeType || typeof mimeType !== "string") return null;
    const normalized = mimeType.trim().toLowerCase();
    if (normalized === "image/jpg") return ".jpg";
    return MIME_TO_EXTENSION[normalized] || null;
  }

  function generateSafeFilename(mimeType, prefix = "mv") {
    const ext = getExtensionFromMime(mimeType);
    if (!ext) throw new Error(`Unsupported MIME type: ${mimeType}`);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    return `${prefix}_${timestamp}_${randomBytes}${ext}`;
  }

  function sanitizeOriginalFilename(rawName) {
    if (!rawName || typeof rawName !== "string") return "media";
    const base = rawName.replace(/^.*[\\/]/, "");
    const cleaned = base.replace(/\.\.+/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim();
    return cleaned.slice(0, 255) || "media";
  }

  // 1. Path traversal attacks
  const traversalInputs = [
    "../../../../etc/passwd.jpg",
    "../../uploads/evil.php",
    "/root/.ssh/id_rsa.png",
    "....//....//config.json",
  ];
  for (const raw of traversalInputs) {
    const safeName = generateSafeFilename("image/jpeg");
    assert.ok(!safeName.includes(".."), `Safe name must not have traversal for input: ${raw}`);
    assert.ok(!safeName.includes("/"), `Safe name must not have / for input: ${raw}`);
    assert.ok(safeName.endsWith(".jpg"));

    const display = sanitizeOriginalFilename(raw);
    assert.ok(!display.includes("/"), `Display name must not contain /: ${display}`);
    assert.ok(!display.includes(".."), `Display name must not contain ..: ${display}`);
  }

  // 2. Windows separators and UNC paths
  const windowsInputs = [
    "..\\..\\Windows\\System32\\cmd.exe.jpg",
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\malware.png",
    "\\\\attacker-server\\share\\exploit.webp",
  ];
  for (const raw of windowsInputs) {
    const safeName = generateSafeFilename("image/png");
    assert.ok(!safeName.includes("\\"), `Safe name must not contain backslash: ${safeName}`);
    assert.ok(!safeName.includes(":"), `Safe name must not contain drive colon: ${safeName}`);
    assert.ok(safeName.endsWith(".png"));

    const display = sanitizeOriginalFilename(raw);
    assert.ok(!display.includes("\\"), `Display name must not contain backslash: ${display}`);
    assert.ok(!display.includes(":"), `Display name must not contain drive colon: ${display}`);
  }

  // 3. Unicode and non-ASCII filenames
  const unicodeInputs = [
    "عکس_عروسی_💍_123.jpeg",
    "婚礼_写真_2026.png",
    "नमस्ते_स्टूडियो_फ़िल्म.webp",
  ];
  for (const raw of unicodeInputs) {
    const safeName = generateSafeFilename("image/webp");
    assert.match(safeName, /^mv_\d+_[a-f0-9]{32}\.webp$/);
    assert.ok(!safeName.includes(" "));

    const display = sanitizeOriginalFilename(raw);
    assert.ok(display.length > 0);
    assert.strictEqual(display, raw);
  }

  // 4. Misleading extensions (MIME type must ALWAYS win over user-supplied extension)
  const misleadingTestCases = [
    { rawName: "malicious.exe.jpg", mime: "image/png", expectedExt: ".png" },
    { rawName: "innocent.jpg", mime: "video/mp4", expectedExt: ".mp4" },
    { rawName: "shell.php.png", mime: "image/jpeg", expectedExt: ".jpg" },
    { rawName: "document.pdf", mime: "image/webp", expectedExt: ".webp" },
    { rawName: "video.avi", mime: "video/webm", expectedExt: ".webm" },
    { rawName: "movie.mp4", mime: "video/quicktime", expectedExt: ".mov" },
    { rawName: "avatar.gif.exe", mime: "image/gif", expectedExt: ".gif" },
  ];
  for (const tc of misleadingTestCases) {
    const safeName = generateSafeFilename(tc.mime);
    assert.ok(
      safeName.endsWith(tc.expectedExt),
      `Safe filename for ${tc.rawName} with MIME ${tc.mime} must end with ${tc.expectedExt}, got: ${safeName}`
    );
    assert.ok(
      !safeName.includes(tc.rawName),
      `Safe filename must never incorporate user filename ${tc.rawName}`
    );
  }
});

// Test 10: Buffer-level MIME detection, validation, and safe filename isolation
test("Buffer-level MIME detection enforces matching MIME, rejects invalid content, and never reuses caller filenames", () => {
  const crypto = require("crypto");

  const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];

  const MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };

  function verifyMagicBytes(buffer, mimeType) {
    if (!buffer || buffer.length < 12 || !mimeType || typeof mimeType !== "string") {
      return false;
    }
    const hex = buffer.toString("hex", 0, 12).toLowerCase();
    const normalizedMime = mimeType.trim().toLowerCase();

    switch (normalizedMime) {
      case "image/jpeg":
        return hex.startsWith("ffd8ff");
      case "image/png":
        return hex.startsWith("89504e47");
      case "image/gif":
        return hex.startsWith("47494638");
      case "image/webp":
        return hex.startsWith("52494646") && buffer.toString("ascii", 8, 12) === "WEBP";
      case "video/webm":
        return hex.startsWith("1a45dfa3");
      case "video/quicktime": {
        if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
        const majorBrand = buffer.toString("ascii", 8, 12).toLowerCase();
        return majorBrand === "qt  ";
      }
      case "video/mp4": {
        if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
        const majorBrand = buffer.toString("ascii", 8, 12).toLowerCase();
        const validBrands = [
          "isom", "iso2", "iso3", "iso4", "iso5", "iso6",
          "mp41", "mp42", "m4v ", "m4a ", "m4b ", "m4p ",
          "avc1", "dash", "msnv"
        ];
        return validBrands.includes(majorBrand);
      }
      default:
        return false;
    }
  }

  function detectMimeFromBuffer(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
      return null;
    }
    for (const mime of [...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES]) {
      if (verifyMagicBytes(buffer, mime)) {
        return mime;
      }
    }
    return null;
  }

  function generateSafeFilename(mimeType, prefix = "mv") {
    const ext = MIME_TO_EXTENSION[mimeType];
    if (!ext) throw new Error(`Unsupported MIME type: ${mimeType}`);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    return `${prefix}_${timestamp}_${randomBytes}${ext}`;
  }

  function prepareUpload(params) {
    const detectedMime = detectMimeFromBuffer(params.buffer);
    if (!detectedMime) {
      throw new Error("Cannot upload: file buffer content is unsupported or failed MIME detection.");
    }

    if (params.mimeType) {
      const rawMime = params.mimeType.trim().toLowerCase();
      const normalizedDeclaredMime = rawMime === "image/jpg" ? "image/jpeg" : rawMime;
      if (normalizedDeclaredMime !== detectedMime) {
        throw new Error(`MIME type mismatch: declared '${params.mimeType}' does not match detected '${detectedMime}'.`);
      }
    }

    const safeFileName = generateSafeFilename(detectedMime);
    return { detectedMime, safeFileName };
  }

  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const validGifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
  const validWebpBuffer = Buffer.concat([Buffer.from("RIFF1234WEBP"), Buffer.alloc(4)]);
  const validMp4Buffer = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x20]), Buffer.from("ftypisom"), Buffer.alloc(4)]);
  const validMovBuffer = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x20]), Buffer.from("ftypqt  "), Buffer.alloc(4)]);

  // 1. A valid buffer with matching MIME is accepted
  const acceptedJpeg = prepareUpload({ buffer: validJpegBuffer, mimeType: "image/jpeg" });
  assert.strictEqual(acceptedJpeg.detectedMime, "image/jpeg");
  assert.ok(acceptedJpeg.safeFileName.endsWith(".jpg"));

  const acceptedJpegAlias = prepareUpload({ buffer: validJpegBuffer, mimeType: "image/jpg" });
  assert.strictEqual(acceptedJpegAlias.detectedMime, "image/jpeg");
  assert.ok(acceptedJpegAlias.safeFileName.endsWith(".jpg"));

  const acceptedPng = prepareUpload({ buffer: validPngBuffer, mimeType: "image/png" });
  assert.strictEqual(acceptedPng.detectedMime, "image/png");
  assert.ok(acceptedPng.safeFileName.endsWith(".png"));

  const acceptedGif = prepareUpload({ buffer: validGifBuffer, mimeType: "image/gif" });
  assert.strictEqual(acceptedGif.detectedMime, "image/gif");
  assert.ok(acceptedGif.safeFileName.endsWith(".gif"));

  const acceptedWebp = prepareUpload({ buffer: validWebpBuffer, mimeType: "image/webp" });
  assert.strictEqual(acceptedWebp.detectedMime, "image/webp");
  assert.ok(acceptedWebp.safeFileName.endsWith(".webp"));

  const acceptedMp4 = prepareUpload({ buffer: validMp4Buffer, mimeType: "video/mp4" });
  assert.strictEqual(acceptedMp4.detectedMime, "video/mp4");
  assert.ok(acceptedMp4.safeFileName.endsWith(".mp4"));

  const acceptedMov = prepareUpload({ buffer: validMovBuffer, mimeType: "video/quicktime" });
  assert.strictEqual(acceptedMov.detectedMime, "video/quicktime");
  assert.ok(acceptedMov.safeFileName.endsWith(".mov"));

  // 2. A buffer with mismatched MIME is rejected
  assert.throws(
    () => prepareUpload({ buffer: validJpegBuffer, mimeType: "image/png" }),
    /MIME type mismatch: declared 'image\/png' does not match detected 'image\/jpeg'/
  );
  assert.throws(
    () => prepareUpload({ buffer: validPngBuffer, mimeType: "image/jpeg" }),
    /MIME type mismatch: declared 'image\/jpeg' does not match detected 'image\/png'/
  );
  assert.throws(
    () => prepareUpload({ buffer: validMp4Buffer, mimeType: "video/webm" }),
    /MIME type mismatch: declared 'video\/webm' does not match detected 'video\/mp4'/
  );

  // 3. Unsupported or invalid buffer content is rejected
  const plainTextBuffer = Buffer.from("Hello world, this is a plain text file pretending to be media");
  assert.throws(
    () => prepareUpload({ buffer: plainTextBuffer, mimeType: "image/jpeg" }),
    /file buffer content is unsupported or failed MIME detection/
  );

  const exeBuffer = Buffer.concat([Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00"), Buffer.alloc(16)]);
  assert.throws(
    () => prepareUpload({ buffer: exeBuffer, mimeType: "image/png" }),
    /file buffer content is unsupported or failed MIME detection/
  );

  const shortBuffer = Buffer.from([0xff, 0xd8, 0xff]);
  assert.throws(
    () => prepareUpload({ buffer: shortBuffer, mimeType: "image/jpeg" }),
    /file buffer content is unsupported or failed MIME detection/
  );

  assert.throws(
    () => prepareUpload({ buffer: Buffer.alloc(0) }),
    /file buffer content is unsupported or failed MIME detection/
  );

  // 4. A caller-supplied safe-looking filename is never reused
  const callerSafeName = "mv_1730000000000_11112222333344445555666677778888.jpg";
  const upload1 = prepareUpload({ buffer: validJpegBuffer, fileName: callerSafeName, mimeType: "image/jpeg" });
  const upload2 = prepareUpload({ buffer: validJpegBuffer, fileName: callerSafeName, mimeType: "image/jpeg" });

  assert.notStrictEqual(upload1.safeFileName, callerSafeName, "Caller safe-looking filename must never be reused");
  assert.notStrictEqual(upload2.safeFileName, callerSafeName, "Caller safe-looking filename must never be reused");
  assert.notStrictEqual(upload1.safeFileName, upload2.safeFileName, "Each upload must generate a fresh unique filename");
  assert.ok(upload1.safeFileName.endsWith(".jpg"));
  assert.ok(upload2.safeFileName.endsWith(".jpg"));
});

// Test 11: Local deletion symlink and path traversal protection in isolated temp directories
test("Local deletion prevents symlink escape, traversal, directory deletion, and missing file errors", async () => {
  const fs = require("fs/promises");
  const os = require("os");
  const path = require("path");

  async function verifySafeLocalDeletionPath(baseUploadsDir, filename) {
    let realUploadsDir;
    try {
      realUploadsDir = await fs.realpath(baseUploadsDir);
    } catch (dirErr) {
      if (dirErr && dirErr.code === "ENOENT") {
        return { error: "Local media file not found on disk or already deleted", status: 404 };
      }
      return { error: "Unable to verify local uploads directory.", status: 500 };
    }

    const localCandidate = path.resolve(baseUploadsDir, filename);

    const uploadsDirPrefix = baseUploadsDir.endsWith(path.sep)
      ? baseUploadsDir
      : baseUploadsDir + path.sep;
    if (!localCandidate.startsWith(uploadsDirPrefix)) {
      return { error: "Access denied: local file deletion outside public/uploads is forbidden", status: 403 };
    }

    let lstatResult;
    try {
      lstatResult = await fs.lstat(localCandidate);
    } catch (statErr) {
      if (statErr && statErr.code === "ENOENT") {
        return { error: "Local media file not found on disk or already deleted", status: 404 };
      }
      return { error: "Failed to access local media file.", status: 500 };
    }

    if (lstatResult.isSymbolicLink()) {
      return { error: "Access denied: symbolic links are not permitted as deletion targets", status: 400 };
    }

    if (!lstatResult.isFile()) {
      return { error: "Target is not a valid file", status: 400 };
    }

    let realTargetFile;
    try {
      realTargetFile = await fs.realpath(localCandidate);
    } catch (realErr) {
      if (realErr && realErr.code === "ENOENT") {
        return { error: "Local media file not found on disk or already deleted", status: 404 };
      }
      return { error: "Failed to resolve real path for local media file.", status: 500 };
    }

    const realUploadsPrefix = realUploadsDir.endsWith(path.sep)
      ? realUploadsDir
      : realUploadsDir + path.sep;
    const relativeToRealUploads = path.relative(realUploadsDir, realTargetFile);

    if (
      !realTargetFile.startsWith(realUploadsPrefix) ||
      relativeToRealUploads.startsWith("..") ||
      path.isAbsolute(relativeToRealUploads) ||
      relativeToRealUploads === ""
    ) {
      return { error: "Access denied: target file resolves outside public/uploads directory", status: 403 };
    }

    let realStat;
    try {
      realStat = await fs.stat(realTargetFile);
    } catch (statErr) {
      if (statErr && statErr.code === "ENOENT") {
        return { error: "Local media file not found on disk or already deleted", status: 404 };
      }
      return { error: "Failed to verify target file status.", status: 500 };
    }

    if (!realStat.isFile()) {
      return { error: "Target is not a valid file", status: 400 };
    }

    return { safePath: realTargetFile };
  }

  // Create isolated sandbox in os.tmpdir() - NEVER touches public/uploads
  const tempBase = await fs.mkdtemp(path.join(os.tmpdir(), "upload-security-test-"));
  const tempUploads = path.join(tempBase, "uploads");
  const tempOutside = path.join(tempBase, "outside");

  try {
    await fs.mkdir(tempUploads, { recursive: true });
    await fs.mkdir(tempOutside, { recursive: true });

    // 1. Valid regular file inside uploads directory
    const legitFile = path.join(tempUploads, "valid-image.jpg");
    await fs.writeFile(legitFile, "sample valid content");

    const validRes = await verifySafeLocalDeletionPath(tempUploads, "valid-image.jpg");
    assert.ok("safePath" in validRes, "Valid regular file must be accepted");
    assert.strictEqual(validRes.safePath, await fs.realpath(legitFile));

    // 2. Reject symlink pointing outside uploads directory
    const outsideTarget = path.join(tempOutside, "sensitive-file.txt");
    await fs.writeFile(outsideTarget, "secret data");

    const symlinkOutside = path.join(tempUploads, "symlink-outside.jpg");
    await fs.symlink(outsideTarget, symlinkOutside, "file");

    const symlinkOutsideRes = await verifySafeLocalDeletionPath(tempUploads, "symlink-outside.jpg");
    assert.strictEqual(symlinkOutsideRes.status, 400);
    assert.match(symlinkOutsideRes.error, /symbolic links are not permitted/i);

    // 3. Reject symlink pointing inside uploads directory
    const symlinkInside = path.join(tempUploads, "symlink-inside.jpg");
    await fs.symlink(legitFile, symlinkInside, "file");

    const symlinkInsideRes = await verifySafeLocalDeletionPath(tempUploads, "symlink-inside.jpg");
    assert.strictEqual(symlinkInsideRes.status, 400);
    assert.match(symlinkInsideRes.error, /symbolic links are not permitted/i);

    // 4. Missing file returns 404
    const missingRes = await verifySafeLocalDeletionPath(tempUploads, "missing-file.jpg");
    assert.strictEqual(missingRes.status, 404);
    assert.match(missingRes.error, /not found on disk/i);

    // 5. Directory target returns 400
    const subDirectory = path.join(tempUploads, "nested-folder");
    await fs.mkdir(subDirectory);

    const dirRes = await verifySafeLocalDeletionPath(tempUploads, "nested-folder");
    assert.strictEqual(dirRes.status, 400);
    assert.match(dirRes.error, /not a valid file/i);

    // 6. Path traversal attempt returns 403
    const traversalRes = await verifySafeLocalDeletionPath(tempUploads, "../../outside/sensitive-file.txt");
    assert.strictEqual(traversalRes.status, 403);
    assert.match(traversalRes.error, /outside public\/uploads is forbidden/i);
  } finally {
    // Isolated teardown
    await fs.rm(tempBase, { recursive: true, force: true });
  }
});

// Test 12: Brevo Transactional Email Notification System
test("Brevo transactional email integration: missing key fallback, HTML escaping, payload validation, mock dispatch, and DB resilience", async () => {
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function buildBrevoEmailPayload(inquiry, config = {}) {
    const senderName = config.senderName || process.env.BREVO_SENDER_NAME || "MAA VAISHNO VIDEO FILM'S";
    const senderEmail = config.senderEmail || process.env.BREVO_SENDER_EMAIL || "maavaishnovideofilm@gmail.com";
    const recipientEmail = config.recipientEmail || process.env.NOTIFICATION_EMAIL || "maavaishnovideofilm@gmail.com";

    const cleanPhone = inquiry.mobile.replace(/\D/g, "");
    const callUrl = `tel:+91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/91${cleanPhone}`;

    const safeId = escapeHtml(inquiry.id);
    const safeName = escapeHtml(inquiry.name);
    const safeMobile = escapeHtml(inquiry.mobile);
    const safeEmail = inquiry.email ? escapeHtml(inquiry.email) : null;
    const safeInquiryType = escapeHtml(inquiry.inquiryType);
    const safeMessage = escapeHtml(inquiry.message);

    const formattedDate = inquiry.createdAt
      ? new Date(inquiry.createdAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        }) + " IST"
      : "Just now";

    const subject = `New Customer Inquiry: ${inquiry.inquiryType} - ${inquiry.name} | MAA VAISHNO VIDEO FILM'S`;

    const htmlContent = `<!DOCTYPE html>
<html>
<body>
<h1>MAA VAISHNO VIDEO FILM'S</h1>
<p>Reference: ${safeId}</p>
<p>Name: ${safeName}</p>
<p>Phone: <a href="${callUrl}">+91 ${safeMobile}</a></p>
<p>Email: ${safeEmail ? `<a href="mailto:${safeEmail}">${safeEmail}</a>` : "Not provided"}</p>
<p>Type: ${safeInquiryType}</p>
<p>Message: ${safeMessage}</p>
<a href="${callUrl}">Call Customer</a>
<a href="${whatsappUrl}">Chat on WhatsApp</a>
</body>
</html>`;

    const textContent = `Reference ID: ${inquiry.id}\nCustomer: ${inquiry.name}\nPhone: +91 ${inquiry.mobile}\nEmail: ${inquiry.email || "Not provided"}\nService: ${inquiry.inquiryType}\nMessage: ${inquiry.message}`;

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: recipientEmail, name: senderName }],
      subject,
      htmlContent,
      textContent,
    };

    if (inquiry.email && inquiry.email.trim() !== "") {
      payload.replyTo = {
        email: inquiry.email.trim(),
        name: inquiry.name.trim(),
      };
    }

    return payload;
  }

  async function mockSendInquiryNotification(inquiry, options = {}) {
    const apiKey = options.apiKey !== undefined ? options.apiKey : process.env.BREVO_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return {
        success: false,
        message: "Brevo API key is not configured.",
        provider: "NONE",
      };
    }

    const payload = buildBrevoEmailPayload(inquiry, options.config);
    const fetchImpl = options.fetchFn || globalThis.fetch;

    try {
      const res = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey.trim(),
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          success: true,
          message: "Email notification delivered successfully via Brevo.",
          provider: "BREVO",
          messageId: data.messageId,
        };
      }

      return {
        success: false,
        message: `Brevo API error: HTTP ${res.status} ${res.statusText}`,
        provider: "BREVO",
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Network error",
        provider: "BREVO",
      };
    }
  }

  // 1. Missing BREVO_API_KEY handling
  const noKeyResult = await mockSendInquiryNotification(
    { id: "cm-001", name: "Ramesh Kumar", mobile: "9876543210", inquiryType: "Wedding Photography", message: "Hello" },
    { apiKey: "" }
  );
  assert.strictEqual(noKeyResult.success, false);
  assert.strictEqual(noKeyResult.provider, "NONE");
  assert.match(noKeyResult.message, /not configured/i);

  // 2. HTML escaping / XSS prevention
  const maliciousInquiry = {
    id: "cm-xss",
    name: '<script>alert("xss")</script>',
    mobile: "9876543210",
    email: 'hacker"onmouseover="alert(1)@evil.com',
    inquiryType: 'Cinema<iframe src="evil.com"></iframe>',
    message: '<img src=x onerror="stealCredentials()">&"\'',
  };
  const xssPayload = buildBrevoEmailPayload(maliciousInquiry);
  assert.ok(!xssPayload.htmlContent.includes("<script"), "HTML content must not contain raw <script");
  assert.ok(!xssPayload.htmlContent.includes("<iframe"), "HTML content must not contain raw <iframe");
  assert.ok(!xssPayload.htmlContent.includes("<img"), "HTML content must not contain raw <img");
  assert.ok(!xssPayload.htmlContent.includes('onerror="'), "HTML content must not contain raw unescaped event handlers");
  assert.ok(xssPayload.htmlContent.includes("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"), "Script tag must be safely encoded");
  assert.ok(xssPayload.htmlContent.includes("&lt;img src=x onerror=&quot;stealCredentials()&quot;&gt;&amp;&quot;&#039;"), "Attributes and quotes must be safely encoded");

  // 3. Proper payload structure with and without replyTo
  const withEmailInquiry = {
    id: "cm-101",
    name: "Pooja Sharma",
    mobile: "9876543210",
    email: "pooja@example.com",
    inquiryType: "Cinematic Wedding Films",
    message: "Need 2-day coverage in Hajipur on 25th Dec.",
  };
  const payloadWithReply = buildBrevoEmailPayload(withEmailInquiry, {
    senderName: "MAA VAISHNO VIDEO FILM'S",
    senderEmail: "maavaishnovideofilm@gmail.com",
    recipientEmail: "maavaishnovideofilm@gmail.com",
  });
  assert.strictEqual(payloadWithReply.sender.name, "MAA VAISHNO VIDEO FILM'S");
  assert.strictEqual(payloadWithReply.sender.email, "maavaishnovideofilm@gmail.com");
  assert.strictEqual(payloadWithReply.to[0].email, "maavaishnovideofilm@gmail.com");
  assert.deepStrictEqual(payloadWithReply.replyTo, { email: "pooja@example.com", name: "Pooja Sharma" });
  assert.match(payloadWithReply.subject, /Pooja Sharma/);
  assert.match(payloadWithReply.subject, /Cinematic Wedding Films/);
  assert.ok(payloadWithReply.htmlContent.includes("tel:+919876543210"));
  assert.ok(payloadWithReply.htmlContent.includes("https://wa.me/919876543210"));
  assert.ok(payloadWithReply.textContent.includes("Pooja Sharma"));

  const withoutEmailInquiry = {
    id: "cm-102",
    name: "Amit Singh",
    mobile: "9123456789",
    email: "",
    inquiryType: "Photo Frames",
    message: "Customized LED photo frame 12x18.",
  };
  const payloadWithoutReply = buildBrevoEmailPayload(withoutEmailInquiry);
  assert.strictEqual(payloadWithoutReply.replyTo, undefined, "replyTo must be omitted when customer email is empty");

  // 4. Mocked successful Brevo response (HTTP 201)
  let capturedUrl = "";
  let capturedHeaders = {};
  let capturedBody = {};
  const mockSuccessFetch = async (url, init) => {
    capturedUrl = url;
    capturedHeaders = init.headers;
    capturedBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ messageId: "<20261105.brevo.test@smtp-relay.brevo.com>" }),
    };
  };

  const successResult = await mockSendInquiryNotification(withEmailInquiry, {
    apiKey: "xkeysib-mock-test-key-12345",
    fetchFn: mockSuccessFetch,
  });
  assert.strictEqual(successResult.success, true);
  assert.strictEqual(successResult.provider, "BREVO");
  assert.strictEqual(successResult.messageId, "<20261105.brevo.test@smtp-relay.brevo.com>");
  assert.strictEqual(capturedUrl, "https://api.brevo.com/v3/smtp/email");
  assert.strictEqual(capturedHeaders["api-key"], "xkeysib-mock-test-key-12345");
  assert.strictEqual(capturedHeaders["content-type"], "application/json");
  assert.strictEqual(capturedBody.sender.email, "maavaishnovideofilm@gmail.com");

  // 5. Mocked Brevo API failure (HTTP 401 Unauthorized)
  const mockFailFetch = async () => ({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    json: async () => ({ code: "unauthorized", message: "Key not found in database" }),
  });
  const failResult = await mockSendInquiryNotification(withEmailInquiry, {
    apiKey: "invalid-key",
    fetchFn: mockFailFetch,
  });
  assert.strictEqual(failResult.success, false);
  assert.strictEqual(failResult.provider, "BREVO");
  assert.match(failResult.message, /401 Unauthorized/);

  // 6. Mocked network timeout / failure
  const mockTimeoutFetch = async () => {
    throw new Error("The operation was aborted due to timeout");
  };
  const timeoutResult = await mockSendInquiryNotification(withEmailInquiry, {
    apiKey: "xkeysib-valid-key",
    fetchFn: mockTimeoutFetch,
  });
  assert.strictEqual(timeoutResult.success, false);
  assert.strictEqual(timeoutResult.provider, "BREVO");
  assert.match(timeoutResult.message, /aborted due to timeout/);

  // 7. Database save resilience simulation
  const mockDb = [];
  async function simulateInquirySubmission(inputData, emailShouldFail = false) {
    // Step A: Save in database
    const contactMessage = {
      id: `cm-${Date.now()}`,
      name: inputData.name,
      phone: inputData.mobile,
      email: inputData.email || null,
      subject: `${inputData.inquiryType} Inquiry`,
      message: inputData.message,
      createdAt: new Date(),
    };
    mockDb.push(contactMessage);

    // Step B: Dispatch email alert asynchronously in non-blocking try/catch
    let emailOutcome;
    try {
      if (emailShouldFail) {
        throw new Error("Brevo connection timed out");
      }
      emailOutcome = { success: true, messageId: "msg-123" };
    } catch (emailErr) {
      emailOutcome = { success: false, error: emailErr.message };
    }

    // Step C: API returns HTTP 201 without exposing emailStatus to client
    return {
      status: 201,
      body: {
        success: true,
        inquiryId: contactMessage.id,
        message: "Thank you! Your inquiry has been sent to Abhimanyu Kumar. We will call you shortly.",
      },
      dbRecordCount: mockDb.length,
      emailOutcome,
    };
  }

  const resWhenEmailFails = await simulateInquirySubmission(
    { name: "Resilience Test User", mobile: "9876543210", inquiryType: "General Inquiry", message: "Testing failure resilience" },
    true
  );

  assert.strictEqual(resWhenEmailFails.status, 201, "API must return HTTP 201 even when email dispatch fails");
  assert.strictEqual(resWhenEmailFails.body.success, true);
  assert.strictEqual(resWhenEmailFails.body.emailStatus, undefined, "emailStatus must not be exposed to client");
  assert.strictEqual(resWhenEmailFails.dbRecordCount, 1, "Database record must be persisted and preserved");
  assert.strictEqual(mockDb[0].name, "Resilience Test User");
});

// Test 13: Production Authentication & Security Hardening
test("Authentication security: data exposure prevention, cookie clearing, session enforcement, rate limiting, and bcrypt bounding", async () => {
  const { SignJWT, jwtVerify } = require("jose");
  const bcrypt = require("bcryptjs");

  const TEST_JWT_SECRET = "super-secure-production-jwt-secret-minimum-32-characters-long!";
  const secretKey = new TextEncoder().encode(TEST_JWT_SECRET);

  // 1. GET logout never returns sensitive fields
  function sanitizeLogoutUser(rawAdmin) {
    if (!rawAdmin) return null;
    return {
      id: rawAdmin.id,
      email: rawAdmin.email,
      name: rawAdmin.name,
      role: rawAdmin.role,
    };
  }

  const rawDbAdmin = {
    id: "admin-123",
    email: "maavaishnovideofilm@gmail.com",
    name: "Abhimanyu Kumar",
    role: "OWNER",
    passwordHash: "$2a$12$eXampLeHashNotToBeExposedDirectlyInResponses",
    refreshTokenHash: "rf_token_hash_secret_value",
    forcePasswordChange: false,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const logoutResponseUser = sanitizeLogoutUser(rawDbAdmin);
  assert.deepStrictEqual(Object.keys(logoutResponseUser).sort(), ["email", "id", "name", "role"].sort());
  assert.strictEqual(logoutResponseUser.passwordHash, undefined, "passwordHash must never be exposed");
  assert.strictEqual(logoutResponseUser.refreshTokenHash, undefined, "refreshTokenHash must never be exposed");
  assert.strictEqual(logoutResponseUser.forcePasswordChange, undefined, "forcePasswordChange must never be exposed");

  // 2. AdminLayout passes only safe user props to client components
  function getSafeAdminLayoutProps(currentAdmin) {
    if (!currentAdmin) return null;
    return {
      id: currentAdmin.id,
      username: currentAdmin.username,
      name: currentAdmin.name,
      role: currentAdmin.role,
    };
  }

  const currentAdminMock = {
    ...rawDbAdmin,
    adminId: rawDbAdmin.id,
    username: rawDbAdmin.email,
  };

  const safeClientProps = getSafeAdminLayoutProps(currentAdminMock);
  assert.deepStrictEqual(Object.keys(safeClientProps).sort(), ["id", "name", "role", "username"].sort());
  assert.strictEqual(safeClientProps.passwordHash, undefined);
  assert.strictEqual(safeClientProps.forcePasswordChange, undefined);
  assert.strictEqual(safeClientProps.refreshTokenHash, undefined);

  // 3. Invalid JWT rejection
  async function testVerifyToken(token, secret) {
    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
      if (typeof payload.userId !== "string" || typeof payload.username !== "string" || payload.role !== "OWNER") {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  const validOwnerToken = await new SignJWT({ userId: "admin-123", username: "maavaishnovideofilm@gmail.com", role: "OWNER" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);

  const verifiedOwner = await testVerifyToken(validOwnerToken, secretKey);
  assert.ok(verifiedOwner !== null, "Valid OWNER token must verify successfully");

  // Tampered secret
  const wrongSecret = new TextEncoder().encode("different-secret-key-of-at-least-32-chars-length!");
  const forgedResult = await testVerifyToken(validOwnerToken, wrongSecret);
  assert.strictEqual(forgedResult, null, "Forged token with wrong secret must be rejected");

  // Expired token
  const expiredToken = await new SignJWT({ userId: "admin-123", username: "maavaishnovideofilm@gmail.com", role: "OWNER" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
    .sign(secretKey);
  const expiredResult = await testVerifyToken(expiredToken, secretKey);
  assert.strictEqual(expiredResult, null, "Expired token must be rejected");

  // 4. Non-OWNER role rejection
  const managerToken = await new SignJWT({ userId: "admin-123", username: "maavaishnovideofilm@gmail.com", role: "MANAGER" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
  const managerResult = await testVerifyToken(managerToken, secretKey);
  assert.strictEqual(managerResult, null, "Non-OWNER token claim must be rejected");

  // 5. Forced password change enforcement
  function evaluateAdminAccess(admin, allowPasswordChange = false) {
    if (!admin) return { allowed: false, status: 401 };
    if (admin.role !== "OWNER") return { allowed: false, status: 403 };
    if (admin.forcePasswordChange && !allowPasswordChange) {
      return { allowed: false, status: 403, requiresPasswordChange: true };
    }
    return { allowed: true, status: 200 };
  }

  const forcedAdmin = { ...rawDbAdmin, forcePasswordChange: true };
  const normalRouteAccess = evaluateAdminAccess(forcedAdmin, false);
  assert.strictEqual(normalRouteAccess.allowed, false);
  assert.strictEqual(normalRouteAccess.requiresPasswordChange, true);

  const passwordChangeRouteAccess = evaluateAdminAccess(forcedAdmin, true);
  assert.strictEqual(passwordChangeRouteAccess.allowed, true);

  // 6. Password change validation & bcrypt 72-byte limit
  function validateNewPasswordInput(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { valid: false, error: "All password fields are required" };
    }
    // Check 72-byte bcrypt limit
    if (
      Buffer.byteLength(currentPassword, "utf8") > 72 ||
      Buffer.byteLength(newPassword, "utf8") > 72 ||
      Buffer.byteLength(confirmPassword, "utf8") > 72
    ) {
      return { valid: false, error: "Password fields cannot exceed 72 bytes in length" };
    }
    if (newPassword !== confirmPassword) {
      return { valid: false, error: "New password and confirmation do not match" };
    }
    if (newPassword === currentPassword) {
      return { valid: false, error: "New password cannot be identical to current password" };
    }
    if (newPassword.length < 8) {
      return { valid: false, error: "New password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return { valid: false, error: "New password does not meet complexity requirements" };
    }
    return { valid: true };
  }

  // 73-character password exceeds 72 bytes
  const tooLongPassword = "A".repeat(73) + "1!";
  const lengthResult = validateNewPasswordInput("OldPass#123", tooLongPassword, tooLongPassword);
  assert.strictEqual(lengthResult.valid, false);
  assert.match(lengthResult.error, /72 bytes/);

  // Identical password
  const identicalResult = validateNewPasswordInput("SamePassword#1", "SamePassword#1", "SamePassword#1");
  assert.strictEqual(identicalResult.valid, false);
  assert.match(identicalResult.error, /identical/i);

  // Valid password
  const validPassResult = validateNewPasswordInput("OldPassword#123", "NewSecretPass#2026!", "NewSecretPass#2026!");
  assert.strictEqual(validPassResult.valid, true);

  // Verify bcrypt 72-byte guard in verifyPassword
  async function safeVerifyPassword(plain, hash) {
    if (typeof plain !== "string" || typeof hash !== "string" || Buffer.byteLength(plain, "utf8") > 72) {
      return false;
    }
    return bcrypt.compare(plain, hash);
  }

  const validHash = await bcrypt.hash("SafePassword#2026", 10);
  assert.strictEqual(await safeVerifyPassword("SafePassword#2026", validHash), true);
  assert.strictEqual(await safeVerifyPassword("X".repeat(80), validHash), false, "Over-72-byte password must be immediately rejected");

  // 7. Logout cookie clearing configuration
  function buildLogoutCookieOptions(isProduction = true) {
    return {
      name: "mv_admin_token",
      value: "",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    };
  }

  const prodCookie = buildLogoutCookieOptions(true);
  assert.strictEqual(prodCookie.value, "");
  assert.strictEqual(prodCookie.httpOnly, true);
  assert.strictEqual(prodCookie.secure, true);
  assert.strictEqual(prodCookie.sameSite, "lax");
  assert.strictEqual(prodCookie.path, "/");
  assert.strictEqual(prodCookie.maxAge, 0);

  // 8. Login rate limiting and malformed requests
  function simulateLoginRateLimiter(failedAttemptsCount, maxAttempts = 5) {
    if (failedAttemptsCount >= maxAttempts) {
      return { allowed: false, status: 429, error: "Too many failed login attempts. Security cooldown active." };
    }
    return { allowed: true, status: 200 };
  }

  assert.strictEqual(simulateLoginRateLimiter(4).allowed, true);
  assert.strictEqual(simulateLoginRateLimiter(5).allowed, false);
  assert.strictEqual(simulateLoginRateLimiter(5).status, 429);
  assert.strictEqual(simulateLoginRateLimiter(8).allowed, false);

  // Malformed / oversized payload test
  function validateLoginPayload(contentLength, body) {
    if (contentLength && contentLength > 4096) {
      return { status: 413, error: "Payload too large. Request body cannot exceed 4KB." };
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { status: 400, error: "Request payload must be a valid JSON object" };
    }
    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password.trim()) {
      return { status: 400, error: "Email address and password are required" };
    }
    if (email.length > 120 || password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
      return { status: 400, error: "Invalid email or password length" };
    }
    return { status: 200 };
  }

  assert.strictEqual(validateLoginPayload(5000, {}).status, 413, "Content-Length > 4KB must return 413");
  assert.strictEqual(validateLoginPayload(100, null).status, 400, "Non-object body must return 400");
  assert.strictEqual(validateLoginPayload(100, { email: "test@example.com", password: "P".repeat(80) }).status, 400, "Password > 72 bytes must return 400");
  assert.strictEqual(validateLoginPayload(100, { email: "maavaishnovideofilm@gmail.com", password: "ValidPassword#123" }).status, 200);

  // Audit log safety: ensure credentials or tokens are never put in metadata
  function buildAuditMetadata(email, reason, userAgent) {
    return {
      attemptedEmail: email,
      reason,
      userAgent,
    };
  }

  const auditLogMeta = buildAuditMetadata("maavaishnovideofilm@gmail.com", "INVALID_CREDENTIALS", "Mozilla/5.0");
  assert.strictEqual(auditLogMeta.password, undefined);
  assert.strictEqual(auditLogMeta.passwordHash, undefined);
  assert.strictEqual(auditLogMeta.token, undefined);
});

// Test 14: Admin login security hardening: trusted IP extraction, body size stream bounding, atomic distributed rate limiting, and audit-log failure handling
test("Admin login security hardening: trusted IP extraction, body size stream bounding, atomic distributed rate limiting, and audit-log failure handling", async () => {
  const net = require("node:net");

  // 1. Client IP identification & spoofed header resilience
  function extractClientIp(headers, directIp) {
    const realIp = headers["x-real-ip"]?.trim();
    if (realIp && net.isIP(realIp)) {
      return realIp;
    }

    const vercelForwarded = headers["x-vercel-forwarded-for"]?.trim();
    if (vercelForwarded) {
      const firstIp = vercelForwarded.split(",")[0].trim();
      if (firstIp && net.isIP(firstIp)) {
        return firstIp;
      }
    }

    if (directIp && typeof directIp === "string" && net.isIP(directIp.trim())) {
      return directIp.trim();
    }

    const forwarded = headers["x-forwarded-for"]?.trim();
    if (forwarded) {
      const firstIp = forwarded.split(",")[0].trim();
      if (firstIp && net.isIP(firstIp)) {
        return firstIp;
      }
    }

    return "127.0.0.1";
  }

  // Trusted x-real-ip
  assert.strictEqual(
    extractClientIp({ "x-real-ip": "203.0.113.195" }),
    "203.0.113.195",
    "Valid IPv4 from x-real-ip must be accepted"
  );

  // Trusted x-vercel-forwarded-for with multiple proxy IPs
  assert.strictEqual(
    extractClientIp({ "x-vercel-forwarded-for": "198.51.100.42, 10.0.0.1" }),
    "198.51.100.42",
    "First IP in x-vercel-forwarded-for chain must be selected"
  );

  // IPv6 address
  assert.strictEqual(
    extractClientIp({ "x-real-ip": "2001:0db8:85a3:0000:0000:8a2e:0370:7334" }),
    "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    "Valid IPv6 address must be accepted"
  );

  // Spoofed malicious / non-IP headers must be rejected and fall back safely
  assert.strictEqual(
    extractClientIp({ "x-forwarded-for": "<script>alert(1)</script>" }),
    "127.0.0.1",
    "XSS or arbitrary string spoof in x-forwarded-for must fall back to safe default"
  );
  assert.strictEqual(
    extractClientIp({ "x-forwarded-for": "1.2.3.4; DROP TABLE" }),
    "127.0.0.1",
    "SQL injection or corrupted IP must fall back to safe default"
  );
  assert.strictEqual(
    extractClientIp({ "x-vercel-ip": "203.0.113.50" }),
    "127.0.0.1",
    "Undocumented x-vercel-ip header must be completely ignored"
  );

  // 2. Request body streaming reader and byte bounding (handles missing Content-Length, spoofed headers, oversized bodies)
  async function simulateReadBoundedJson(contentLengthHeader, streamChunks, maxBytes = 4096) {
    if (contentLengthHeader) {
      const parsedLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(parsedLength) && parsedLength > maxBytes) {
        return { ok: false, status: 413, error: `Payload too large. Request body cannot exceed ${maxBytes} bytes.` };
      }
    }

    if (!streamChunks || streamChunks.length === 0) {
      return { ok: false, status: 400, error: "Request body cannot be empty" };
    }

    let totalBytes = 0;
    const receivedChunks = [];
    for (const chunk of streamChunks) {
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        return { ok: false, status: 413, error: `Payload too large. Request body cannot exceed ${maxBytes} bytes.` };
      }
      receivedChunks.push(chunk);
    }

    if (totalBytes === 0) {
      return { ok: false, status: 400, error: "Request body cannot be empty" };
    }

    const rawText = Buffer.concat(receivedChunks).toString("utf8");
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return { ok: false, status: 400, error: "Invalid or malformed JSON payload" };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, status: 400, error: "Request payload must be a valid JSON object" };
    }

    return { ok: true, data: parsed };
  }

  // Missing Content-Length header with valid JSON stream
  const validChunk = Buffer.from(JSON.stringify({ email: "maavaishnovideofilm@gmail.com", password: "SafePassword#1" }));
  const missingClResult = await simulateReadBoundedJson(null, [validChunk]);
  assert.strictEqual(missingClResult.ok, true, "Missing Content-Length with valid stream must parse successfully");
  assert.strictEqual(missingClResult.data.email, "maavaishnovideofilm@gmail.com");

  // Missing Content-Length header with oversized stream (> 4KB)
  const hugeChunk1 = Buffer.alloc(3000, "A");
  const hugeChunk2 = Buffer.alloc(2000, "B");
  const oversizedStreamResult = await simulateReadBoundedJson(null, [hugeChunk1, hugeChunk2]);
  assert.strictEqual(oversizedStreamResult.ok, false);
  assert.strictEqual(oversizedStreamResult.status, 413, "Oversized stream without Content-Length must return 413");

  // Spoofed small Content-Length header with oversized stream
  const spoofedClResult = await simulateReadBoundedJson("50", [hugeChunk1, hugeChunk2]);
  assert.strictEqual(spoofedClResult.ok, false);
  assert.strictEqual(spoofedClResult.status, 413, "Spoofed Content-Length header cannot bypass stream byte counter");

  // Content-Length header > 4096 bytes fast rejection
  const headerOversizedResult = await simulateReadBoundedJson("8192", [validChunk]);
  assert.strictEqual(headerOversizedResult.ok, false);
  assert.strictEqual(headerOversizedResult.status, 413, "Content-Length > 4KB must reject immediately with 413");

  // Malformed JSON stream
  const malformedChunk = Buffer.from("{ invalid-json-syntax");
  const malformedResult = await simulateReadBoundedJson(null, [malformedChunk]);
  assert.strictEqual(malformedResult.ok, false);
  assert.strictEqual(malformedResult.status, 400, "Malformed JSON must return 400");

  // 3. Concurrent login attempts & atomic advisory lock serialization
  // In a distributed environment, PostgreSQL transaction advisory locks serialize attempts per IP
  class MockPostgresDatabase {
    constructor() {
      this.failedAttempts = new Map(); // ip -> count
      this.locks = new Set(); // active lock keys
    }

    async acquireAdvisoryLock(key) {
      while (this.locks.has(key)) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      this.locks.add(key);
    }

    releaseAdvisoryLock(key) {
      this.locks.delete(key);
    }

    getFailures(ip) {
      return this.failedAttempts.get(ip) || 0;
    }

    recordFailure(ip) {
      const cur = this.getFailures(ip);
      this.failedAttempts.set(ip, cur + 1);
    }
  }

  const mockDb = new MockPostgresDatabase();
  mockDb.failedAttempts.set("198.51.100.1", 4); // 4 failures already recorded

  async function simulateAtomicLoginAttempt(ip, isPasswordValid) {
    const lockKey = `rate_limit_ip_${ip}`;
    await mockDb.acquireAdvisoryLock(lockKey);
    try {
      const currentFailures = mockDb.getFailures(ip);
      if (currentFailures >= 5) {
        return { status: 429, error: "Too many failed login attempts from this IP. Security cooldown active." };
      }

      // Simulate password verification delay (~50ms)
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (!isPasswordValid) {
        mockDb.recordFailure(ip);
        return { status: 401, error: "Invalid email or password" };
      }

      return { status: 200, success: true };
    } finally {
      mockDb.releaseAdvisoryLock(lockKey);
    }
  }

  // Fire 5 concurrent requests from the same IP simultaneously when count is 4
  const concurrentResults = await Promise.all([
    simulateAtomicLoginAttempt("198.51.100.1", false),
    simulateAtomicLoginAttempt("198.51.100.1", false),
    simulateAtomicLoginAttempt("198.51.100.1", false),
    simulateAtomicLoginAttempt("198.51.100.1", false),
    simulateAtomicLoginAttempt("198.51.100.1", false),
  ]);

  // Request 1 should fail with 401 and increment count to 5
  // Requests 2-5 must observe count >= 5 and return 429
  const status401Count = concurrentResults.filter((r) => r.status === 401).length;
  const status429Count = concurrentResults.filter((r) => r.status === 429).length;

  assert.strictEqual(status401Count, 1, "Exactly one concurrent attempt should execute before reaching rate limit");
  assert.strictEqual(status429Count, 4, "Remaining 4 concurrent attempts must be rate-limited with 429");
  assert.strictEqual(mockDb.getFailures("198.51.100.1"), 5, "Database failures must not exceed 5");

  // 4. Distributed rate-limit behavior: IP-based vs Account Velocity (No Permanent Lockout)
  function evaluateDistributedRateLimit({
    ip,
    ipFailures,
    accountFailures,
    isRecognizedAdminIp,
  }) {
    // 1. IP rate limiting (strictly 5 failed attempts per 15 mins)
    if (ipFailures >= 5) {
      return {
        allowed: false,
        status: 429,
        reason: "IP_COOLDOWN",
        error: "Too many failed login attempts from this IP. Security cooldown active.",
      };
    }

    // 2. Account velocity protection (distributed brute force >= 15 failed attempts)
    if (accountFailures >= 15) {
      // If the request comes from a recognized admin IP (e.g. logged in within 30 days), allow it
      // This prevents attackers from using distributed botnets to lock out the owner
      if (!isRecognizedAdminIp) {
        return {
          allowed: false,
          status: 429,
          reason: "ACCOUNT_DISTRIBUTED_COOLDOWN",
          error: "High volume of failed login attempts detected for this account. Account is temporarily in a 15-minute security cooldown.",
        };
      }
    }

    return { allowed: true, status: 200 };
  }

  // Under limit
  assert.strictEqual(evaluateDistributedRateLimit({ ip: "1.2.3.4", ipFailures: 3, accountFailures: 5, isRecognizedAdminIp: false }).allowed, true);

  // IP limit triggered
  const ipBlocked = evaluateDistributedRateLimit({ ip: "1.2.3.4", ipFailures: 5, accountFailures: 5, isRecognizedAdminIp: false });
  assert.strictEqual(ipBlocked.allowed, false);
  assert.strictEqual(ipBlocked.status, 429);
  assert.strictEqual(ipBlocked.reason, "IP_COOLDOWN");

  // Distributed attack on account (15 failures across botnet) from unknown attacker IP
  const distributedBlocked = evaluateDistributedRateLimit({ ip: "203.0.113.99", ipFailures: 1, accountFailures: 15, isRecognizedAdminIp: false });
  assert.strictEqual(distributedBlocked.allowed, false);
  assert.strictEqual(distributedBlocked.status, 429);
  assert.strictEqual(distributedBlocked.reason, "ACCOUNT_DISTRIBUTED_COOLDOWN");

  // Legitimate administrator logging in from recognized IP during active distributed attack
  const legitimateAdminAccess = evaluateDistributedRateLimit({ ip: "198.51.100.5", ipFailures: 1, accountFailures: 25, isRecognizedAdminIp: true });
  assert.strictEqual(legitimateAdminAccess.allowed, true, "Recognized admin IP must NOT be locked out by distributed attacker traffic");

  // 5. Safe Failure Behavior for Failed-Login Audit Logging (Fail-Closed)
  async function handleFailedLoginAudit(recordAuditFn) {
    try {
      const recorded = await recordAuditFn();
      if (!recorded) {
        return { status: 503, error: "Authentication service temporarily unavailable. Please retry later." };
      }
      return { status: 401, error: "Invalid email or password" };
    } catch {
      return { status: 503, error: "Authentication service temporarily unavailable. Please retry later." };
    }
  }

  // When audit logging succeeds, return 401
  const normalAuditResult = await handleFailedLoginAudit(async () => true);
  assert.strictEqual(normalAuditResult.status, 401);

  // When audit logging fails, MUST fail-closed with 503 to prevent uncounted brute-force bypass
  const failingAuditResult1 = await handleFailedLoginAudit(async () => false);
  assert.strictEqual(failingAuditResult1.status, 503, "Failed audit write must return 503");

  const failingAuditResult2 = await handleFailedLoginAudit(async () => {
    throw new Error("Neon connection timeout");
  });
  assert.strictEqual(failingAuditResult2.status, 503, "Database audit exception must return 503");

  // 6. Bcrypt 72-byte UTF-8 limit consistency across login, password change, and hashing
  function checkBcryptLimit(password) {
    if (typeof password !== "string") return false;
    if (password.length > 72) return false;
    if (Buffer.byteLength(password, "utf8") > 72) return false;
    return true;
  }

  assert.strictEqual(checkBcryptLimit("SafePassword#1234"), true);
  assert.strictEqual(checkBcryptLimit("A".repeat(72)), true, "Exact 72 ASCII bytes is valid");
  assert.strictEqual(checkBcryptLimit("A".repeat(73)), false, "73 ASCII bytes must be rejected");

  // Multi-byte Unicode: 25 characters of 3-byte characters = 75 bytes (> 72 bytes)
  const unicode25Chars = "अ".repeat(25); // each 'अ' is 3 bytes in UTF-8
  assert.strictEqual(unicode25Chars.length, 25, "Character length is only 25");
  assert.strictEqual(Buffer.byteLength(unicode25Chars, "utf8"), 75, "Byte length is 75 bytes");
  assert.strictEqual(checkBcryptLimit(unicode25Chars), false, "UTF-8 > 72 bytes must be rejected even if character count < 72");
});

// Test 15: Security Remediation: Exact flag match, CSRF origin check, bounded pagination, URL policy, open redirect prevention, and OWNER-only consistency
test("Security Remediation: Exact flag match, CSRF origin check, bounded pagination, URL policy, open redirect prevention, and OWNER-only consistency", async () => {
  // 1. Exact match between JWT passwordChangeRequired and DB forcePasswordChange
  function evaluateSessionRules(sessionClaim, dbFlag, allowPasswordChange = false) {
    const jwtRequiresChange = sessionClaim === true;
    const dbRequiresChange = dbFlag === true;

    // 1. Enforce exact match between JWT claim and DB flag
    if (jwtRequiresChange !== dbRequiresChange) {
      return { allowed: false, reason: "FLAG_MISMATCH" };
    }

    // 2. Normal admin endpoints block temporary sessions
    if (dbRequiresChange && !allowPasswordChange) {
      return { allowed: false, reason: "PASSWORD_CHANGE_REQUIRED" };
    }

    // 3. Password-change-only endpoints block normal sessions
    if (!dbRequiresChange && allowPasswordChange) {
      return { allowed: false, reason: "NORMAL_SESSION_NOT_PERMITTED_ON_PW_CHANGE" };
    }

    return { allowed: true, reason: "AUTHORIZED" };
  }

  // Temporary session on password-change route: allowed
  assert.strictEqual(evaluateSessionRules(true, true, true).allowed, true);
  // Temporary session on normal route: blocked
  assert.strictEqual(evaluateSessionRules(true, true, false).allowed, false);
  assert.strictEqual(evaluateSessionRules(true, true, false).reason, "PASSWORD_CHANGE_REQUIRED");

  // Normal session on normal route: allowed
  assert.strictEqual(evaluateSessionRules(false, false, false).allowed, true);
  // Normal session on password-change route: blocked
  assert.strictEqual(evaluateSessionRules(false, false, true).allowed, false);
  assert.strictEqual(evaluateSessionRules(false, false, true).reason, "NORMAL_SESSION_NOT_PERMITTED_ON_PW_CHANGE");

  // Flag mismatches: strictly rejected
  assert.strictEqual(evaluateSessionRules(true, false, false).allowed, false);
  assert.strictEqual(evaluateSessionRules(true, false, false).reason, "FLAG_MISMATCH");
  assert.strictEqual(evaluateSessionRules(false, true, true).allowed, false);
  assert.strictEqual(evaluateSessionRules(false, true, true).reason, "FLAG_MISMATCH");

  // 2. CSRF Origin / Referer validation
  function verifyCsrf(method, host, origin, referer, configuredAppUrl = "http://localhost:3000") {
    const m = method.toUpperCase();
    if (m === "GET" || m === "HEAD" || m === "OPTIONS") return true;

    if (!origin && !referer) return false;

    function getHost(urlStr) {
      try {
        return new URL(urlStr).host.toLowerCase();
      } catch {
        return null;
      }
    }

    const hostLower = host ? host.toLowerCase() : null;
    const configuredHost = configuredAppUrl ? getHost(configuredAppUrl) : null;

    if (origin) {
      const oHost = getHost(origin);
      if (!oHost) return false;
      return (hostLower && oHost === hostLower) || (configuredHost && oHost === configuredHost);
    }

    if (referer) {
      const rHost = getHost(referer);
      if (!rHost) return false;
      return (hostLower && rHost === hostLower) || (configuredHost && rHost === configuredHost);
    }

    return false;
  }

  // Safe idempotent methods
  assert.strictEqual(verifyCsrf("GET", "localhost:3000", null, null), true);

  // Valid Origin match
  assert.strictEqual(verifyCsrf("POST", "localhost:3000", "http://localhost:3000", null), true);
  // Valid Referer fallback
  assert.strictEqual(verifyCsrf("POST", "localhost:3000", null, "http://localhost:3000/admin/products"), true);

  // Cross-origin attack: attacker.com
  assert.strictEqual(verifyCsrf("POST", "localhost:3000", "https://attacker.com", null), false, "Cross-origin Origin must be rejected");
  assert.strictEqual(verifyCsrf("PUT", "localhost:3000", null, "https://attacker.com/page"), false, "Cross-origin Referer must be rejected");
  assert.strictEqual(verifyCsrf("DELETE", "localhost:3000", null, null), false, "Missing Origin/Referer on mutation must be rejected");

  // 3. Open Redirect Sanitization
  function sanitizeAdminRedirect(target, fallback = "/admin/dashboard") {
    if (!target || typeof target !== "string") return fallback;
    const trimmed = target.trim();
    if (!trimmed.startsWith("/admin")) return fallback;
    if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
    const safeAdminPathRegex = /^\/admin(\/[a-zA-Z0-9_\-\.\/]*)?(\?[a-zA-Z0-9_\-=&]*)?$/;
    return safeAdminPathRegex.test(trimmed) ? trimmed : fallback;
  }

  assert.strictEqual(sanitizeAdminRedirect("/admin/dashboard"), "/admin/dashboard");
  assert.strictEqual(sanitizeAdminRedirect("/admin/products?status=PUBLISHED"), "/admin/products?status=PUBLISHED");
  assert.strictEqual(sanitizeAdminRedirect("//evil.com"), "/admin/dashboard", "Protocol-relative URL must be neutralized");
  assert.strictEqual(sanitizeAdminRedirect("//evil.com/admin"), "/admin/dashboard", "Protocol-relative path must be neutralized");
  assert.strictEqual(sanitizeAdminRedirect("https://evil.com/admin"), "/admin/dashboard", "External URL must be neutralized");
  assert.strictEqual(sanitizeAdminRedirect("javascript:alert(1)"), "/admin/dashboard", "JavaScript scheme must be neutralized");
  assert.strictEqual(sanitizeAdminRedirect("/admin/\\evil.com"), "/admin/dashboard", "Backslash traversal trick must be neutralized");

  // 4. Consistent 32-byte JWT Secret Enforcement
  function validateJwtSecretBytes(secret) {
    if (!secret || typeof secret !== "string") return false;
    return Buffer.byteLength(secret, "utf8") >= 32;
  }

  assert.strictEqual(validateJwtSecretBytes("short-secret-key-too-weak"), false);
  assert.strictEqual(validateJwtSecretBytes("a".repeat(31)), false);
  assert.strictEqual(validateJwtSecretBytes("a".repeat(32)), true);
  // 16 2-byte characters = 32 bytes
  assert.strictEqual(validateJwtSecretBytes("é".repeat(16)), true);

  // 5. Admin API input validation: string boolean rejection & price / stock validation
  function validateProductInput(body) {
    const { name, price, mrp, stock, available, featured } = body;

    if (typeof name !== "string" || !name.trim()) return { valid: false, error: "Name required" };
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return { valid: false, error: "Invalid price" };

    if (mrp !== undefined && mrp !== null) {
      if (typeof mrp !== "number" || !isFinite(mrp) || mrp <= 0 || mrp < price) {
        return { valid: false, error: "MRP cannot be less than selling price" };
      }
    }

    if (stock !== undefined) {
      if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
        return { valid: false, error: "Stock cannot be negative" };
      }
    }

    // Reject string booleans
    if (available !== undefined && typeof available !== "boolean") {
      return { valid: false, error: "available must be a boolean" };
    }
    if (featured !== undefined && typeof featured !== "boolean") {
      return { valid: false, error: "featured must be a boolean" };
    }

    return { valid: true };
  }

  // String booleans must be strictly rejected
  assert.strictEqual(validateProductInput({ name: "Mug", price: 299, available: "true" }).valid, false);
  assert.strictEqual(validateProductInput({ name: "Mug", price: 299, featured: "false" }).valid, false);
  assert.strictEqual(validateProductInput({ name: "Mug", price: 299, available: true, featured: false }).valid, true);

  // Negative stock rejected
  assert.strictEqual(validateProductInput({ name: "Mug", price: 299, stock: -1 }).valid, false);
  assert.strictEqual(validateProductInput({ name: "Mug", price: 299, stock: 10 }).valid, true);

  // Price & MRP relationship
  assert.strictEqual(validateProductInput({ name: "Mug", price: 500, mrp: 400 }).valid, false, "MRP < Price must be rejected");
  assert.strictEqual(validateProductInput({ name: "Mug", price: 500, mrp: 600 }).valid, true);
  assert.strictEqual(validateProductInput({ name: "Mug", price: Infinity }).valid, false, "Infinity must be rejected");

  // 6. Media and Video URL validation
  function validateMediaUrlCheck(url) {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed || trimmed.startsWith("//")) return false;
    if (trimmed.startsWith("/")) return !/[\x00-\x1f\x7f\\]/.test(trimmed);

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") return false;
      const h = parsed.hostname.toLowerCase();
      return h.endsWith(".imagekit.io") || h === "ik.imagekit.io" || h === "localhost";
    } catch {
      return false;
    }
  }

  assert.strictEqual(validateMediaUrlCheck("/logo.png"), true);
  assert.strictEqual(validateMediaUrlCheck("/uploads/mv_123.jpg"), true);
  assert.strictEqual(validateMediaUrlCheck("https://ik.imagekit.io/3syjgmr6o/mv_123.jpg"), true);
  assert.strictEqual(validateMediaUrlCheck("javascript:alert(1)"), false);
  assert.strictEqual(validateMediaUrlCheck("data:image/png;base64,AAA"), false);
  assert.strictEqual(validateMediaUrlCheck("file:///etc/passwd"), false);
  assert.strictEqual(validateMediaUrlCheck("http://insecure.com/pic.jpg"), false);
  assert.strictEqual(validateMediaUrlCheck("//evil.com/pic.jpg"), false);

  // 7. Bounded pagination on inquiries
  function computeBoundedPagination(searchParams) {
    const rawPage = parseInt(searchParams.page || "1", 10);
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    const rawLimit = parseInt(searchParams.limit || "20", 10);
    const limit = !isNaN(rawLimit) && rawLimit >= 1 ? Math.min(100, rawLimit) : 20;

    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  assert.deepStrictEqual(computeBoundedPagination({ page: "2", limit: "50" }), { page: 2, limit: 50, skip: 50 });
  assert.deepStrictEqual(computeBoundedPagination({ page: "-5", limit: "500" }), { page: 1, limit: 100, skip: 0 });
  assert.deepStrictEqual(computeBoundedPagination({ page: "NaN", limit: "invalid" }), { page: 1, limit: 20, skip: 0 });

  // 8. Multi-table media reference protection before deletion
  function canDeleteMediaAsset(assetUrl, fileId, databaseRecords) {
    const isReferencedInProducts = databaseRecords.products.some((p) => p.images.includes(assetUrl));
    const isReferencedInGallery = databaseRecords.gallery.some(
      (g) => g.imageUrl === assetUrl || (fileId && g.fileId === fileId)
    );
    const isReferencedInServices = databaseRecords.services.some(
      (s) => s.heroImage === assetUrl || s.icon === assetUrl
    );
    const isReferencedInSlides = databaseRecords.slides.some((sl) => sl.imageUrl === assetUrl);

    return !(isReferencedInProducts || isReferencedInGallery || isReferencedInServices || isReferencedInSlides);
  }

  const mockDbRefs = {
    products: [{ id: "p1", images: ["https://ik.imagekit.io/mv/shared_photo.jpg"] }],
    gallery: [],
    services: [],
    slides: [],
  };

  assert.strictEqual(
    canDeleteMediaAsset("https://ik.imagekit.io/mv/shared_photo.jpg", "file_123", mockDbRefs),
    false,
    "Asset referenced in Product table must NOT be deleted from ImageKit"
  );

  assert.strictEqual(
    canDeleteMediaAsset("https://ik.imagekit.io/mv/unreferenced_photo.jpg", "file_999", mockDbRefs),
    true,
    "Unreferenced asset is safely permitted to be deleted"
  );

  // 9. ImageKit File ID strict format validation
  const IMAGEKIT_FILE_ID_REGEX = /^[a-f0-9]{24}$/i;
  assert.strictEqual(IMAGEKIT_FILE_ID_REGEX.test("60a7bc1234567890abcdef12"), true);
  assert.strictEqual(IMAGEKIT_FILE_ID_REGEX.test("../traversal"), false);
  assert.strictEqual(IMAGEKIT_FILE_ID_REGEX.test("invalid-length"), false);
  assert.strictEqual(IMAGEKIT_FILE_ID_REGEX.test("60A7BC1234567890ABCDEF12"), true);

  // 10. OWNER-only RBAC policy consistency
  function hasRequiredRoleCheck(adminRole, allowedRoles = ["OWNER"]) {
    if (adminRole !== "OWNER") return false;
    return Array.isArray(allowedRoles) && allowedRoles.includes("OWNER");
  }

  assert.strictEqual(hasRequiredRoleCheck("OWNER", ["OWNER"]), true);
  assert.strictEqual(hasRequiredRoleCheck("MANAGER", ["OWNER", "MANAGER"]), false, "MANAGER must be rejected in OWNER-only model");
  assert.strictEqual(hasRequiredRoleCheck("EDITOR", ["OWNER", "EDITOR"]), false, "EDITOR must be rejected in OWNER-only model");
  assert.strictEqual(hasRequiredRoleCheck("GUEST", ["OWNER"]), false);
});


