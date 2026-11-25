/**
 * One-time image pipeline.
 * Produces square, responsive, modern-format variants of the headshot
 * plus a generated Open Graph card. Run with: node tools/build-images.js
 */
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const SOURCE = process.argv[2];
const OUT_DIR = path.resolve("src/assets/img");

if (!SOURCE || !existsSync(SOURCE)) {
  console.error(`Source image not found: ${SOURCE}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const out = (name) => path.join(OUT_DIR, name);

async function run() {
  const meta = await sharp(SOURCE).metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${meta.format}`);

  // Never upscale: a variant can only be as large as the shortest source edge.
  // Keep the srcset width descriptors in src/_includes/partials/hero-photo.njk
  // in sync with the sizes logged below.
  const maxSize = Math.min(meta.width, meta.height);
  const size1x = Math.min(640, maxSize);
  const size2x = Math.min(1280, maxSize);

  // Square crop, attention-weighted so the face stays centered.
  const square = (size) =>
    sharp(SOURCE)
      .rotate() // honour EXIF orientation
      .resize(size, size, { fit: "cover", position: sharp.strategy.attention });

  await square(size1x).jpeg({ quality: 82, mozjpeg: true }).toFile(out("ben-woodruff.jpg"));
  await square(size2x).jpeg({ quality: 80, mozjpeg: true }).toFile(out("ben-woodruff@2x.jpg"));
  await square(size1x).webp({ quality: 80 }).toFile(out("ben-woodruff.webp"));
  await square(size1x).avif({ quality: 62 }).toFile(out("ben-woodruff.avif"));
  await square(size2x).webp({ quality: 78 }).toFile(out("ben-woodruff@2x.webp"));
  await square(size2x).avif({ quality: 60 }).toFile(out("ben-woodruff@2x.avif"));

  console.log(`Headshot variants written at ${size1x}w (1x) and ${size2x}w (2x).`);

  // --- Open Graph card: 1200x630, headshot right, text left -----------
  const W = 1200;
  const H = 630;

  const photo = await sharp(SOURCE)
    .rotate()
    .resize(430, 430, { fit: "cover", position: sharp.strategy.attention })
    .composite([
      {
        input: Buffer.from(
          `<svg width="430" height="430"><rect width="430" height="430" rx="8"/></svg>`
        ),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#0a0a0a"/>
  <text x="80" y="214" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="26" letter-spacing="3" fill="#71717a" font-weight="600">SEO STRATEGIST</text>
  <text x="80" y="300" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="76" fill="#0a0a0a" font-weight="700">Ben Woodruff</text>
  <text x="80" y="372" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="30" fill="#52525b">Technical SEO · Local Search · Analytics</text>
  <text x="80" y="430" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="26" fill="#71717a">8+ years · 110+ sites migrated · multi-location healthcare</text>
  <rect x="80" y="486" width="86" height="5" fill="#0a0a0a"/>
</svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: photo, left: 660, top: 100 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out("og-default.jpg"));

  console.log("OG card written.");

  // Apple touch icon
  await square(180).png().toFile(out("../apple-touch-icon.png"));
  console.log("Apple touch icon written.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
