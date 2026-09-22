// Renders public/favicon.ico (16 and 32 px) and public/apple-touch-icon.png
// (180 px) from public/favicon.svg. One-off: run `node scripts/favicons.mjs`
// after editing the SVG, then commit the results.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url));
const png = (size, source = svg) => sharp(source, { density: 72 * (size / 32) * 4 }).resize(size, size).png().toBuffer();

// An .ico is a small directory of images; modern ones may hold PNGs as they are.
const images = await Promise.all([16, 32].map((size) => png(size)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const size = [16, 32][i];
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4); // colour planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
writeFileSync(new URL("../public/favicon.ico", import.meta.url), Buffer.concat([header, ...images]));

// iOS rounds the corners itself and fills transparency with black: square tile.
const square = Buffer.from(svg.toString().replace('rx="7"', 'rx="0"'));
writeFileSync(new URL("../public/apple-touch-icon.png", import.meta.url), await png(180, square));
console.log("Wrote public/favicon.ico and public/apple-touch-icon.png");
