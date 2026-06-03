/**
 * populate-books.mjs
 *
 * One-shot importer for the four Labrats book covers + documents into Sanity.
 *
 * Usage (PowerShell, from project root C:\Users\chris\Projects\labrats):
 *   $env:SANITY_WRITE_TOKEN = "sk..."
 *   node populate-books.mjs
 *
 * What it does:
 *   1. Uploads each PNG cover as a Sanity image asset
 *   2. Creates or updates a `book` document per cover with title, slug,
 *      description, seriesOrder, ageRange, and coverImage (with hotspot
 *      centred on the character group, slightly above mid-frame to favour
 *      the rats over the black title banner)
 *   3. Idempotent — re-running won't create duplicates; it patches existing
 *      docs by slug.
 *
 * Prereqs:
 *   npm i -D @sanity/client mime
 *
 *   (@sanity/client is almost certainly already in your project; mime is
 *   tiny and only used for the upload Content-Type. If you'd rather skip
 *   it, the upload call works without it too — Sanity sniffs PNG/JPG fine.)
 */

import { createClient } from '@sanity/client';
import { readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

// ---------------------------------------------------------------------------
// Config — edit COVER_DIR if your covers live somewhere else
// ---------------------------------------------------------------------------
const PROJECT_ID = 'o9qrmykx';
const DATASET = 'production';
const API_VERSION = '2024-10-01';

// Where the four PNGs live locally. Adjust if you've moved them.
const COVER_DIR = 'C:/Users/chris/Downloads/archive (3)';

const BOOKS = [
  {
    seriesOrder: 1,
    title: 'Labrats: Escape from Lab Zero',
    slug: 'escape-from-lab-zero',
    description:
      "Led by the cunning Basil Whiskerworth, the Rat Pack make their first daring break for freedom. With Sprocket's explosive distractions, Shadow's stealth, and Patchy Paws patching up the wounded, they outwit every trap the scientists have laid. When the alarms sound, the real adventure begins.",
    ageRange: 'Ages 8–14',
    coverFile: 'hf_20260518_162102_9ccbda15-e7ce-4113-b726-9d7a536532d4.png',
  },
  {
    seriesOrder: 2,
    title: 'Labrats: The Cybernetic Conspiracy',
    slug: 'the-cybernetic-conspiracy',
    description:
      "Dr. Magnus Steelheart is upgrading ordinary rodents into cybernetic soldiers — and the Rat Pack are next on his list. Byte C. Cheddar races to hack Steelheart's network while Major Chomps leads a daring counter-assault. Can they expose the plot before it's too late?",
    ageRange: 'Ages 8–14',
    coverFile: 'hf_20260518_162617_f433a387-89cc-45b9-9538-cbfebe0b8959.png',
  },
  {
    seriesOrder: 3,
    title: 'Labrats: Operation Cheese Heist',
    slug: 'operation-cheese-heist',
    description:
      "Tank Cheddarbulk's beloved cheese stores have been confiscated, and the Rat Pack aren't standing for it. Ziggy Zappertail's chaotic diversions and Twirl Tailspin's acrobatic infiltration turn a simple supply run into a full-scale war against the most heavily fortified facility in ratdom.",
    ageRange: 'Ages 8–14',
    coverFile: 'hf_20260518_162747_0ea4330a-e700-4b8a-b3d0-e0319103005b.png',
  },
  {
    seriesOrder: 4,
    title: 'Labrats: Rise of the Mad Scientist',
    slug: 'rise-of-the-mad-scientist',
    description:
      "Dr. Sylvia Thorn has built a machine that could rewrite every living genome on Earth — and Nibbles McSqueak is the only one who's cracked the blueprints. Basil assembles the full Rat Pack while Elixir Wiskermore brews a counter-agent from stolen lab chemicals. STEM skills and sharp claws required.",
    ageRange: 'Ages 8–14',
    coverFile: 'hf_20260518_173324_a6791439-4188-4000-b95c-6ce57d5a84e5.png',
  },
];

// Hotspot anchored slightly above centre (y = 0.42) so square crops
// favour the character group over the black title banner at the bottom.
const HOTSPOT = {
  x: 0.5,
  y: 0.42,
  height: 0.65,
  width: 0.7,
};
const CROP = { top: 0, bottom: 0, left: 0, right: 0 };

// ---------------------------------------------------------------------------
// Sanity client
// ---------------------------------------------------------------------------
const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error(
    '\n  Missing SANITY_WRITE_TOKEN.\n' +
      '  In PowerShell, run:\n' +
      '    $env:SANITY_WRITE_TOKEN = "sk..."\n' +
      '  then re-run this script.\n',
  );
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Upload a local PNG and return its Sanity asset _id. */
async function uploadCover(localPath, filename) {
  console.log(`  ↑ uploading ${filename} …`);
  const buffer = await readFile(localPath);
  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType: 'image/png',
  });
  console.log(`    asset ready: ${asset._id}`);
  return asset._id;
}

/** Look up an existing book document by slug. Returns _id or null. */
async function findExistingBook(slug) {
  return client.fetch(
    `*[_type == "book" && slug.current == $slug][0]._id`,
    { slug },
  );
}

/** Build the full document body Sanity will store. */
function buildBookDoc(book, assetId) {
  return {
    _type: 'book',
    title: book.title,
    slug: { _type: 'slug', current: book.slug },
    description: book.description,
    seriesOrder: book.seriesOrder,
    ageRange: book.ageRange,
    coverImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: assetId },
      hotspot: { _type: 'sanity.imageHotspot', ...HOTSPOT },
      crop: { _type: 'sanity.imageCrop', ...CROP },
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(
    `\n  Labrats book importer\n` +
      `  project: ${PROJECT_ID} / dataset: ${DATASET}\n` +
      `  covers from: ${COVER_DIR}\n`,
  );

  for (const book of BOOKS) {
    console.log(`\n▸ Book ${book.seriesOrder}: ${book.title}`);

    const localPath = resolve(COVER_DIR, book.coverFile);
    let assetId;
    try {
      assetId = await uploadCover(localPath, basename(book.coverFile));
    } catch (err) {
      console.error(`  ✗ upload failed: ${err.message}`);
      console.error(`    expected file at: ${localPath}`);
      process.exitCode = 1;
      continue;
    }

    const docBody = buildBookDoc(book, assetId);
    const existingId = await findExistingBook(book.slug);

    if (existingId) {
      console.log(`  ↻ updating existing doc ${existingId}`);
      await client
        .patch(existingId)
        .set(docBody)
        .commit();
      console.log(`  ✓ updated`);
    } else {
      console.log(`  + creating new doc`);
      const created = await client.create(docBody);
      console.log(`  ✓ created ${created._id}`);
    }
  }

  console.log(
    `\n  Done. Trigger your Netlify build hook (or wait for the Sanity webhook)` +
      `\n  to publish the new /media page.\n`,
  );
}

main().catch((err) => {
  console.error('\n  ✗ Fatal error:', err);
  process.exit(1);
});
