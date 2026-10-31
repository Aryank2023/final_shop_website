const fs = require("fs");
const path = require("path");

function checkEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.log(".env does not exist!");
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    if (key.includes("URL") || key.includes("HOST")) {
      try {
        const u = new URL(val);
        console.log(`${key}: protocol=${u.protocol}, host=${u.host}, pathname=${u.pathname}, isPlaceholder=${val.includes("replace") || val.includes("cool-forest") || val.includes("example")}`);
      } catch (e) {
        console.log(`${key}: value_length=${val.length}, isPlaceholder=${val.includes("replace") || val.includes("cool-forest") || val.includes("example")}`);
      }
    } else {
      console.log(`${key}: configured=${Boolean(val)}, length=${val.length}`);
    }
  }
}

checkEnv();
