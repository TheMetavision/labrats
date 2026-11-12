import { defineType, defineField } from 'sanity';

/**
 * game: a private record of one Labrats game and its art.  [CROSS-BRAND]
 *
 * Studio and the Social Content Studio only. The website never queries this
 * type, so it is not rendered and never reaches the sitemap (the sitemap is
 * built from Astro pages, and the /games pages are static).
 */
export default defineType({
  name: 'game',
  title: 'Game',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', description: 'e.g. "Vent Runner".', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'url', title: 'Live game page', type: 'url' }),
    defineField({ name: 'characters', title: 'Characters', type: 'array', of: [{ type: 'reference', to: [{ type: 'character' }] }] }),
    defineField({
      name: 'gameArt',
      title: 'Game art (private)',
      description: 'Title cards, level cards, stage art, model renders and promos for this game. Not shown on the website.',
      type: 'array',
      options: { layout: 'grid' },
      of: [{ type: 'galleryImage' }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'url', media: 'gameArt.0.asset' },
  },
});
