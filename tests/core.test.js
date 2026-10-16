const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");

// Test 1: Password hashing and verification
test("Password hashing with bcryptjs", async () => {
  const password = "MaaVaishno@2026!";
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
