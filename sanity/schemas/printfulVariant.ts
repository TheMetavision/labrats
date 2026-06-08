import { defineType, defineField } from 'sanity';

// Object type referenced by product.variants[].printfulVariants[].
// Populated automatically by sync-products.mjs (one entry per size x colour).
// Matches the shape the sync writes: { size, colour, syncVariantId }.
// If the Fuglys studio already has this file, copy that one across instead —
// it's brand-agnostic and should be identical.
export default defineType({
  name: 'printfulVariant',
  title: 'Printful Variant',
  type: 'object',
  fields: [
    defineField({ name: 'size', title: 'Size', type: 'string' }),
    defineField({ name: 'colour', title: 'Colour', type: 'string' }),
    defineField({ name: 'syncVariantId', title: 'Sync Variant ID', type: 'string' }),
  ],
  preview: {
    select: { title: 'colour', subtitle: 'size' },
    prepare: ({ title, subtitle }) => ({ title: title || '(no colour)', subtitle }),
  },
});
