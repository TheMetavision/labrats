import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const logoUrl = 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=512,fit=crop/Aq2q3anW6qTLnbeK/labrats-square-jul25-mp8JqDpWMyf16pEv.png';
const publicDir = path.join(process.cwd(), 'public');

async function run() {
  console.log('Downloading Labrats square logo...');
  const response = await fetch(logoUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded (${(buffer.length / 1024).toFixed(0)}KB)`);

  // favicon.png — 180x180 for apple-touch-icon
  await sharp(buffer)
    .resize(180, 180, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png (180x180)');

  // favicon-32.png — 32x32 for browser tab
  await sharp(buffer)
    .resize(32, 32, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('✓ favicon-32.png (32x32)');

  console.log('\nDone! Push to GitHub and the new favicon will be live.');
}

run().catch(console.error);
