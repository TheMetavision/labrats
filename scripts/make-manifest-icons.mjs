// scripts/make-manifest-icons.mjs — icon-192.png and icon-512.png for the web
// app manifest, from the 1024px wordmark icon (labrats-icon-A-1024.png), with
// its flat navy background swapped for the site background (#0a0a0a).
//
//   node scripts/make-manifest-icons.mjs [path/to/labrats-icon-A-1024.png]
//
// favicon.ico and apple-touch-icon.png are left as they are.
// Each pixel's distance from the navy decides how much of it is background,
// so the anti-aliased letter edges blend into the new colour without a fringe.
import sharp from 'sharp';

const src = process.argv[2] || 'labrats-icon-A-1024.png';
const OLD = [20, 28, 48];   // the source icon's background
const NEW = [10, 10, 10];   // --color-black, the site's --color-bg
const T = 48;               // distance at which a pixel counts as fully foreground

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 3) {
  const d = Math.hypot(data[i] - OLD[0], data[i + 1] - OLD[1], data[i + 2] - OLD[2]);
  const bg = Math.max(0, 1 - d / T); // 1 = pure background, 0 = foreground
  for (let c = 0; c < 3; c++) data[i + c] = Math.round(Math.min(255, Math.max(0, data[i + c] + bg * (NEW[c] - OLD[c]))));
}
const img = sharp(data, { raw: info });
const full = await img.png().toBuffer();
for (const size of [192, 512]) {
  await sharp(full).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`public/icon-${size}.png`);
}
console.log('public/icon-192.png and public/icon-512.png written');
