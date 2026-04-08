#!/usr/bin/env node

import { createClient } from '@sanity/client';
import { config } from 'dotenv';
config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'o9qrmykx',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const characters = [
  { name: "Rex", role: "Team Leader & Tactician", bio: "Cool under pressure and built for command, Rex runs every mission with surgical precision. He escaped the lab first — and has never stopped running since. Where others see dead ends, Rex sees routes.", abilities: ["Enhanced tactical processing", "Heightened reflexes", "Leadership under fire"], quote: "We don't have a plan B. We have a plan A that adapts.", sortOrder: 1 },
  { name: "Zara", role: "Chief Inventor & Engineer", bio: "Zara can build an ion disruptor from a paperclip and two batteries — and she has. Her lab-enhanced brain processes engineering problems in milliseconds, though her creations have a habit of exploding at the worst possible moment.", abilities: ["Accelerated engineering cognition", "Photographic memory", "Improvised weapon construction"], quote: "It's not a malfunction. It's an unexpected feature.", sortOrder: 2 },
  { name: "Blitz", role: "Infiltration Specialist", bio: "Blitz moves faster than any camera can track and slips through security systems like smoke through a keyhole. He's never met a laser grid he couldn't navigate — or a mission briefing he could sit still through.", abilities: ["Enhanced speed and agility", "Thermal invisibility", "Lock manipulation"], quote: "If you saw me, I wasn't trying.", sortOrder: 3 },
  { name: "Nova", role: "Hacker & Intelligence Officer", bio: "Nova sees the world as one giant network — and she's already three steps inside it. Her cybernetic neural implant gives her direct interface with any digital system. She insists the real superpower is knowing which questions to ask.", abilities: ["Cybernetic neural interface", "Real-time network infiltration", "Pattern recognition"], quote: "I don't have opinions about your plan. I have data.", sortOrder: 4 },
];

const episodes = [
  { title: "Labrats Official Trailer", videoType: "trailer", youtubeUrl: "", youtubeId: "", description: "Genetically enhanced. Dangerously smart. Fighting for their freedom. Meet the Rat Pack.", featured: true, publishedAt: "2026-01-15T00:00:00Z" },
  { title: "The Great Escape", videoType: "episode", youtubeUrl: "", youtubeId: "", description: "Rex leads the team through the facility's most heavily guarded corridor. One chance. No margin for error. Classic Tuesday.", featured: false, publishedAt: "2026-03-01T00:00:00Z" },
  { title: "Operation Cheese Heist", videoType: "episode", youtubeUrl: "", youtubeId: "", description: "The plan was simple. It always is. Six minutes in and Blitz had already rewired the security system backwards.", featured: false, publishedAt: "2026-04-01T00:00:00Z" },
];

const blogPosts = [
  { title: "Nova: The Rat Who Hacked Her Own Brain", category: "lore", excerpt: "Before she was the team's intelligence officer, Nova was just another subject in Lab 7. Then she got curious about the implant they gave her. Then she started asking better questions than the scientists who built it.", publishedAt: "2026-03-12T00:00:00Z" },
  { title: "Operation Cheese Heist: The Full Debrief", category: "dispatches", excerpt: "The plan was simple. It always is. Six minutes in and Blitz had already rewired the security system backwards, Rex had eaten the decoy, and Nova was explaining to Zara why you can't just explode things that have other things inside them.", publishedAt: "2026-02-28T00:00:00Z" },
  { title: "How Labrats Was Born: The Origin Story", category: "bts", excerpt: "Every great idea starts somewhere strange. Labrats started in a conversation about what would happen if the smartest beings in a laboratory weren't the scientists. The answer got complicated fast.", publishedAt: "2026-01-15T00:00:00Z" },
];

const categories = [
  { title: "Apparel", description: "Hoodies, tees, caps — lab-tested, street-approved", sortOrder: 1 },
  { title: "Accessories", description: "Totes, caps, notebooks, pin sets", sortOrder: 2 },
  { title: "Collectibles", description: "Posters, prints, enamel pins", sortOrder: 3 },
];

const siteSettings = {
  _id: 'siteSettings', _type: 'siteSettings',
  siteName: 'Labrats',
  tagline: 'Where Genius Meets Mischief!',
  siteDescription: 'Labrats is an animated sci-fi series following genetically enhanced lab rats fighting for freedom. Explore the book series, meet the characters, and join the rebellion.',
  contactEmail: 'contact@labrats.uk',
  youtubeChannel: 'https://www.youtube.com/@LabratsMedia',
  socialLinks: [
    { _type: 'object', _key: 'yt', platform: 'YouTube', url: 'https://www.youtube.com/@LabratsMedia' },
    { _type: 'object', _key: 'ig', platform: 'Instagram', url: 'https://www.instagram.com/labratsmedia' },
    { _type: 'object', _key: 'tt', platform: 'TikTok', url: 'https://www.tiktok.com/@labratsmedia' },
    { _type: 'object', _key: 'x', platform: 'X', url: 'https://x.com/labratsmedia' },
  ],
  footerText: '© The Metavision 2026. All rights reserved.',
  newsletterHeadline: 'Join the Rebellion',
  newsletterSubtext: 'Lab dispatches, mission reports, and first access to merch drops.',
};

async function migrate() {
  console.log('🐀 Starting Labrats content migration...\n');

  console.log('📋 Creating site settings...');
  await client.createOrReplace(siteSettings);
  console.log('   ✅ Site settings created\n');

  console.log('👥 Creating characters...');
  for (const char of characters) {
    await client.createOrReplace({
      _type: 'character', _id: `character-${slugify(char.name)}`,
      name: char.name, slug: { _type: 'slug', current: slugify(char.name) },
      role: char.role, bio: char.bio, abilities: char.abilities,
      quote: char.quote, sortOrder: char.sortOrder,
      seoTitle: `${char.name} — Labrats`,
      seoDescription: char.bio.substring(0, 155) + '...',
    });
    console.log(`   ✅ ${char.name}`);
  }
  console.log(`   → ${characters.length} characters created\n`);

  console.log('🎬 Creating episodes...');
  for (const ep of episodes) {
    await client.createOrReplace({
      _type: 'episode', _id: `episode-${slugify(ep.title)}`,
      title: ep.title, slug: { _type: 'slug', current: slugify(ep.title) },
      videoType: ep.videoType, youtubeUrl: ep.youtubeUrl, youtubeId: ep.youtubeId,
      description: ep.description, featured: ep.featured, publishedAt: ep.publishedAt,
      seoTitle: `${ep.title} — Labrats`, seoDescription: ep.description.substring(0, 155) + '...',
    });
    console.log(`   ✅ ${ep.title}`);
  }
  console.log(`   → ${episodes.length} episodes created\n`);

  console.log('📝 Creating blog posts...');
  for (const post of blogPosts) {
    await client.createOrReplace({
      _type: 'blogPost', _id: `post-${slugify(post.title)}`,
      title: post.title, slug: { _type: 'slug', current: slugify(post.title) },
      category: post.category, excerpt: post.excerpt,
      body: [{ _type: 'block', _key: 'placeholder', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 'span1', text: post.excerpt + ' [Full article content to be added in Sanity Studio]', marks: [] }] }],
      publishedAt: post.publishedAt,
      seoTitle: `${post.title} — Rat Tales`, seoDescription: post.excerpt.substring(0, 155) + '...',
    });
    console.log(`   ✅ ${post.title}`);
  }
  console.log(`   → ${blogPosts.length} blog posts created\n`);

  console.log('🏷️  Creating merch categories...');
  for (const cat of categories) {
    await client.createOrReplace({
      _type: 'category', _id: `category-${slugify(cat.title)}`,
      title: cat.title, slug: { _type: 'slug', current: slugify(cat.title) },
      description: cat.description, sortOrder: cat.sortOrder,
    });
    console.log(`   ✅ ${cat.title}`);
  }
  console.log(`   → ${categories.length} categories created\n`);

  console.log('═══════════════════════════════════════════');
  console.log('🎉 Migration complete!');
  console.log(`   ${characters.length} characters`);
  console.log(`   ${episodes.length} episodes`);
  console.log(`   ${blogPosts.length} blog posts`);
  console.log(`   ${categories.length} categories`);
  console.log(`   1 site settings document`);
  console.log('═══════════════════════════════════════════');
}

migrate().catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
