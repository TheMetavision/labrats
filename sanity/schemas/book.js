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
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'orderUrl',
      title: 'Order URL',
      type: 'url',
      description: 'Link to purchase (Amazon, shop page, etc.)',
    },
    {
      name: 'seriesOrder',
      title: 'Series Order',
      type: 'number',
      description: 'Position in the book series (1, 2, 3...)',
      validation: (Rule) => Rule.min(1),
    },
    {
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      description: 'e.g. "Ages 8–14"',
    },
    {
      name: 'pageCount',
      title: 'Page Count',
      type: 'number',
    },
    {
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    },
    {
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
    },
    {
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    },
  ],
  orderings: [
    {
      title: 'Series Order',
      name: 'seriesOrderAsc',
      by: [{ field: 'seriesOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'seriesOrder',
      media: 'coverImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `Book ${subtitle}` : '',
        media,
      };
    },
  },
};
