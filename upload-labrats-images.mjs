import { createClient } from '@sanity/client';
import fetch from 'node-fetch';

const client = createClient({
  projectId: 'o9qrmykx',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

// Character name → Zyro image URL mapping (extracted from live site)
const characterImages = [
  { name: 'Dr. Basil Whiskerworth', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/dr.-basil-whiskerworth-mnlqQ0Z2lWf4DE1K.jpeg' },
  { name: 'Major Chomps', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/major-chomps-mp8qyOebV3c000r1.jpeg' },
  { name: 'Sprocket Sparksqueak', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/sprocket-sparksqueak-AwvDleEbWgsrRb3r.jpeg' },
  { name: 'Shadow Sneakerson', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/shadow-sneakerson-mp8qyOebxqFv0KxE.jpeg' },
  { name: 'Ziggy Zappertail', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/ziggy-zappertail-AQEDlzQWq3Uq1BXw.jpeg' },
  { name: 'Tank Cheddarbulk', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/tank-cheddarbulk-d957kOW9b0fqK5kg.jpeg' },
  { name: 'Nibbles McSqueak', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/nibbles-mcsqueak-m7V5RNq9wZhlLBZ0.jpeg' },
  { name: 'Fizzy Furlough', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/fizzy-furlough-YNqPRn9DOac6804e.jpeg' },
  { name: 'Twirl Tailspin', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/twirl-tailspin-AQEDlzQWo5Ix9Exz.jpeg' },
  { name: 'Byte C. Cheddar', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/byte-c.-cheddar-d957kOWOkLUk9ro1.jpeg' },
  { name: 'Elixir Wiskermore', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/elixir-wiskermore-mjEqJO88GkFNaw8x.jpeg' },
  { name: 'Boomer Blazeclaw', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/boomer-blazeclaw-mP42RGwGayTX6p5V.jpeg' },
  { name: 'Quill Scribblesnout', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/quill-scribblesnout-mxBMPGE2pLu7OklL.jpeg' },
  { name: 'Patchy Paws', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/patchy-paws-dJo5RpEWQMFE7Vvb.jpeg' },
  { name: 'Torque Gearsnout', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/torque-gearsnout-dWxBZqpQWwUq19L3.jpeg' },
  { name: 'The Rat King (Mortimer Von Gnaw)', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/the-rat-king-mortimer-von-gnaw-m5KLR4pE4VirnvN7.jpeg' },
  { name: 'Dr. Ignatius Crank', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/dr.-ignatius-crank-AQEDlzQ3x0t5va43.jpeg' },
  { name: 'MechaMouser 9000', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/mechamouser-9000-YX4a3OWVqKceDJln.jpeg' },
  { name: 'Ludwig Fenrir', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/ludwig-fenrir-mk3qbX2GBaCrM2eJ.jpeg' },
  { name: 'Cerberus Trio', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/cerberus-trio-m2WaRyoj5bIx8B95.jpeg' },
  { name: 'Dr. Sylvia Thorn', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/dr.-sylvia-thorn-AwvDleEE29uXxyGW.jpeg' },
  { name: 'Dr. Magnus Steelheart', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/dr.-magnus-steelheart-A1aBR6ooJLhe92Po.jpeg' },
  { name: 'Professor Abigail Fume', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/professor-abigail-fume-AMqlR5VWLbUGnMvx.jpeg' },
  { name: 'General Victor Clawthorne', url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/general-victor-clawthorne-A1aBR6oDqxheRznD.jpeg' },
];

// Site-level images
const siteImages = {
  heroImage: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1024,fit=crop/Aq2q3anW6qTLnbeK/4fcf55a6-c179-44e1-9d13-0da27ed83a70-mnlqDMNG58Ir1Lyo.png',
  bookPromoImage: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/Aq2q3anW6qTLnbeK/519287ea-aca7-48dd-8644-09b87bd778a4-YbNqQW3pNkcv55qe.png',
  logo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop/Aq2q3anW6qTLnbeK/labrats-square-jul25-mp8JqDpWMyf16pEv.png',
  footerLogo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,fit=crop/Aq2q3anW6qTLnbeK/labrats-landscape-jul25-YZ9jxZw971UBgjew.png',
};

async function downloadAndUpload(url, filename) {
  console.log(`  Downloading ${filename}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  console.log(`  Uploading to Sanity (${(buffer.length / 1024).toFixed(0)}KB)...`);
  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType,
  });
  return asset._id;
}

async function run() {
  console.log('=== Labrats Image Migration ===\n');

  // 0. Delete placeholder/duplicate characters (Rex, Zara, Blitz, Nova)
  console.log('--- Removing Placeholder Characters ---');
  const placeholderNames = ['Rex', 'Zara', 'Blitz', 'Nova'];
  const toDelete = await client.fetch(
    `*[_type == "character" && name in $names] { _id, name }`,
    { names: placeholderNames }
  );

  for (const doc of toDelete) {
    await client.delete(doc._id);
    console.log(`✗ Deleted: ${doc.name} (${doc._id})`);
  }
  console.log(`Removed ${toDelete.length} placeholder characters\n`);

  // 1. Upload character portraits
  console.log('--- Character Portraits ---');
  const allChars = await client.fetch(`*[_type == "character"] { _id, name }`);
  console.log(`Found ${allChars.length} characters in Sanity\n`);

  let matched = 0;
  let skipped = 0;

  for (const img of characterImages) {
    const char = allChars.find(c =>
      c.name.toLowerCase() === img.name.toLowerCase() ||
      c.name.toLowerCase().includes(img.name.toLowerCase()) ||
      img.name.toLowerCase().includes(c.name.toLowerCase())
    );

    if (!char) {
      console.log(`⚠ No match for "${img.name}" — skipping`);
      skipped++;
      continue;
    }

    try {
      const safeName = img.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const assetId = await downloadAndUpload(img.url, `${safeName}.jpeg`);

      await client.patch(char._id).set({
        portrait: {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        },
      }).commit();

      console.log(`✓ ${img.name} → ${char.name} (${char._id})`);
      matched++;
    } catch (err) {
      console.error(`✗ Failed: ${img.name} — ${err.message}`);
    }
  }

  console.log(`\nCharacters: ${matched} uploaded, ${skipped} skipped\n`);

  // 2. Upload site-level images to siteSettings
  console.log('--- Site Settings Images ---');
  const settings = await client.fetch(`*[_type == "siteSettings"][0] { _id }`);

  if (!settings) {
    console.log('⚠ No siteSettings document found — creating one');
    await client.create({ _type: 'siteSettings', siteName: 'Labrats' });
    const newSettings = await client.fetch(`*[_type == "siteSettings"][0] { _id }`);
    settings._id = newSettings._id;
  }

  for (const [field, url] of Object.entries(siteImages)) {
    try {
      const assetId = await downloadAndUpload(url, `${field}.png`);
      await client.patch(settings._id).set({
        [field]: {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        },
      }).commit();
      console.log(`✓ ${field} uploaded`);
    } catch (err) {
      console.error(`✗ Failed: ${field} — ${err.message}`);
    }
  }

  console.log('\n=== Done! Rebuild your Netlify site to see all images. ===');
}

run().catch(console.error);
