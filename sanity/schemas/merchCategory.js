// Reconstructed 2026-05-30. No documents currently exist of this type
// (live dataset count = 0). Schema is a minimal placeholder so the Studio
// structure list resolves; mirrors the existing `category` schema's shape.
//
// If this type ends up being functionally identical to `category`, consider
// consolidating to one or the other in a future cleanup.

export default {
  name: 'merchCategory',
  title: 'Merch Category',
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
      rows: 2,
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'sortOrder',
      title: 'Display Order',
      type: 'number',
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
  },
};
