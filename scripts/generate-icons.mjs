// Generates the site icons and the link-preview (Open Graph) image.
//   node scripts/generate-icons.mjs
// The mark is a lowercase "i" (as in the imood wordmark) drawn with shapes
// rather than text, so it renders the same everywhere regardless of fonts.
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const pub = new URL('../public/', import.meta.url);
const out = (name) => new URL(name, pub).pathname;

const BG_FROM = '#2b2a33'; // rainy-cafe scene palette
const BG_TO = '#6b5345';

const mark = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG_FROM}"/>
      <stop offset="1" stop-color="${BG_TO}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  <circle cx="256" cy="146" r="40" fill="#fff"/>
  <rect x="220" y="218" width="72" height="200" rx="36" fill="#fff"/>
</svg>`;

// Rounded for browser tabs; full-bleed for iOS/Android, which apply their own mask.
const rounded = mark(112);
const square = mark(0);

writeFileSync(out('favicon.svg'), rounded);
await sharp(Buffer.from(rounded)).resize(32, 32).png().toFile(out('favicon-32.png'));
await sharp(Buffer.from(square)).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
await sharp(Buffer.from(square)).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(Buffer.from(square)).resize(512, 512).png().toFile(out('icon-512.png'));

// Open Graph image: rainy-cafe poster, darkened, with the wordmark.
const ogText = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#000" fill-opacity="0.45"/>
  <text x="600" y="320" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="140" font-weight="600" fill="#fff" letter-spacing="-4">imood</text>
  <text x="600" y="400" text-anchor="middle" font-family="Thonburi, sans-serif"
        font-size="40" fill="#fff" fill-opacity="0.8">เพลงและบรรยากาศสำหรับทำงานไปพร้อมกัน</text>
</svg>`;
await sharp(out('scenes/rainy-cafe/poster.webp'))
  .resize(1200, 630, { fit: 'cover' })
  .composite([{ input: Buffer.from(ogText) }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(out('og.jpg'));

console.log('icons + og.jpg written to public/');
