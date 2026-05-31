// One-off: generate PWA icons (yellow jersey on dark) via sharp.
// Run: node scripts/gen-pwa-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(root, "../public/icons");
mkdirSync(outDir, { recursive: true });

const JERSEY =
  "M 60,30 C 60,30 75,22 100,22 C 125,22 140,30 140,30 L 188,55 C 192,57 192,62  190,66 L 172,108 C 170,113 164,113 161,108 L 152,90 L 152,228 C 152,232 148,236 144,236 L 56,236 C 52,236 48,232 48,228 L 48,90 L 39,108 C 36,113 30,113 28,108 L 10,66 C 8,62 8,57 12,55 L 60,30 Z";

// scale: jersey is drawn in a 200x250 box; pad controls the safe zone.
function svg({ size, pad, rounded }) {
  const inner = size - pad * 2;
  const scale = inner / 250;
  const w = 200 * scale;
  const tx = (size - w) / 2;
  const ty = pad;
  const radius = rounded ? size * 0.22 : 0;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0d0d14"/>
  <g transform="translate(${tx},${ty}) scale(${scale})">
    <path d="${JERSEY}" fill="#facc15" stroke="#0d0d14" stroke-width="3"/>
    <text x="100" y="160" text-anchor="middle" font-size="78" font-weight="900"
      font-family="Arial, sans-serif" fill="#0d0d14">7</text>
  </g>
</svg>`);
}

const targets = [
  { file: "pwa-192.png", size: 192, pad: 24, rounded: true },
  { file: "pwa-512.png", size: 512, pad: 64, rounded: true },
  { file: "maskable-512.png", size: 512, pad: 96, rounded: false },
  { file: "apple-touch-icon.png", size: 180, pad: 20, rounded: false },
];

for (const t of targets) {
  await sharp(svg(t)).png().toFile(path.join(outDir, t.file));
  console.log("wrote", t.file);
}
console.log("done");
