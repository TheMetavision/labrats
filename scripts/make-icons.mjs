// scripts/make-icons.mjs — favicon.ico (16/32/48) and apple-touch-icon.png
// from public/favicon.png (180x180, the square Labrats logo).
//
//   node scripts/make-icons.mjs
//
// The 512px source the old create-favicon.mjs downloaded is gone (404), so
// nothing larger than 180px is generated: upscaling would only blur it.
// An .ico can hold PNG images directly; sharp writes the PNGs and this packs
// them into the ICO container (6-byte header + 16-byte entry per image).
import sharp from 'sharp';
import fs from 'node:fs';

const src = 'public/favicon.png';
const sizes = [16, 32, 48];

const pngs = await Promise.all(sizes.map((s) => sharp(src).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length;
const entries = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0); // width
  e.writeUInt8(sizes[i], 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...pngs]));
fs.copyFileSync(src, 'public/apple-touch-icon.png');
console.log(`favicon.ico (${sizes.join('/')}px) and apple-touch-icon.png (180px) written`);
