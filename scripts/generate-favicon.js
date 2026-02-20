/**
 * Convert public/trive.webp to app/favicon.ico
 * Run: npm install sharp to-ico --save-dev && node scripts/generate-favicon.js
 */
const fs = require("fs");
const path = require("path");

async function main() {
  let sharp, toIco;
  try {
    sharp = require("sharp");
    toIco = require("to-ico");
  } catch (e) {
    console.error("Install dependencies first: npm install sharp to-ico --save-dev");
    process.exit(1);
  }

  const root = path.join(__dirname, "..");
  const input = path.join(root, "public", "trive.webp");
  const output = path.join(root, "app", "favicon.ico");

  if (!fs.existsSync(input)) {
    console.error("Not found: public/trive.webp");
    process.exit(1);
  }

  const png32 = await sharp(input).resize(32, 32).png().toBuffer();
  const ico = await toIco([png32]);
  fs.writeFileSync(output, ico);
  console.log("Created app/favicon.ico");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
