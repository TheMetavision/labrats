// Reconstructed 2026-05-30 from the live Sanity dataset.
// Mirrors the field shape of all 4 book documents in production
// (Escape from Lab Zero, The Cybernetic Conspiracy, etc).

export default {
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Back-cover style summary, plain text.',
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'format',
      title: 'Format',
      type: 'string',
      options: {
        list: [
          { title: 'Book', value: 'book' },
          { title: 'Audiobook', value: 'audiobook' },
          { title: 'E-book', value: 'ebook' },
        ],
        layout: 'radio',
      },
      initialValue: 'book',
    },
    {
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      description: 'e.g. "Ages 8–14".',
    },
    {
      name: 'seriesOrder',
      title: 'Series Order',
      type: 'number',
      description: 'Position in the series (1, 2, 3...).',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Coming Soon', value: 'coming-soon' },
          { title: 'Out of Print', value: 'out-of-print' },
          { title: 'Draft / Hidden', value: 'draft' },
        ],
        layout: 'radio',
      },
      initialValue: 'available',
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'ageRange',
      media: 'coverImage',
      order: 'seriesOrder',
    },
    prepare({ title, subtitle, media, order }) {
      return {
        title,
        subtitle: order != null ? `Book ${order}${subtitle ? ' · ' + subtitle : ''}` : subtitle,
        media,
      };
    },
  },

  orderings: [
    {
      title: 'Series Order',
      name: 'seriesOrderAsc',
      by: [{ field: 'seriesOrder', direction: 'asc' }],
    },
    {
      title: 'Title (A→Z)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
};
