// Generates PWA icons from the existing favicon.svg
// Run with: node scripts/generate-icons.cjs

const sharp = require("sharp");
const path = require("path");

const SVG = path.join(__dirname, "../public/favicon.svg");
const OUT = path.join(__dirname, "../public");

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function run() {
  for (const { name, size } of SIZES) {
    await sharp(SVG)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, name));
    console.log(`✅ ${name} (${size}×${size})`);
  }
  console.log("\nAll icons generated in public/");
}

run().catch(console.error);
