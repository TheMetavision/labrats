// Reconstructed 2026-05-30 from the live Sanity dataset.
// Original source not in local repo; this schema mirrors the field shape
// of all 8 worldLocation documents in production (Lab Zero, Lab 7, etc).
// 2026-10-21: referenceGallery added (canon environment renders, copied from
// The Fuglys schema with Labrats lighting states). Not rendered by the site.
// image (hero) added before it to match The Fuglys.
// 2026-11-12: referenceGallery now takes galleryImage items too, and sits in the
// collapsed "Reference (private)" fieldset. Existing renders are untouched.

import { referenceGalleryField, referencePrivateFieldset } from './galleryImage';

export default {
  name: 'worldLocation',
  title: 'World Location',
  type: 'document',
  fieldsets: [referencePrivateFieldset],
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
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'One-line evocative subtitle for the location.',
    },
    {
      name: 'image',
      title: 'Hero image',
      type: 'image',
      description: 'Main image for the location. Use the hotspot to control where the focal point sits on crops.',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) => Rule.required().warning('Alt text is important for SEO and accessibility'),
        },
      ],
    },
    referenceGalleryField(
      'Working and promo images for this location, plus the approved canon environment renders (the official look for books, animation and games). Not shown on the website.',
      [
        {
          // Legacy canon render: keeps _type 'image' so the 40 renders written
          // via the API on 2026-10-21 load unchanged. New uploads use galleryImage.
          type: 'image',
          title: 'Canon render (environment plate)',
          options: { hotspot: true },
          fields: [
            {
              name: 'view',
              title: 'View',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: ['master', 'reverse', 'ground-level', 'close-up', 'elevated', 'aerial', 'interior', 'detail', 'other'],
              },
            },
            {
              name: 'timeOfDay',
              title: 'Time of day',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: ['dawn', 'midday', 'golden-hour', 'sunset', 'night', 'storm', 'normal', 'alert', 'power-cut', 'lockdown', 'flashback', 'royal-gold', 'security-armed'],
              },
            },
            { name: 'isMaster', title: 'Master plate', type: 'boolean', initialValue: false },
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'higgsfieldJobId', title: 'Higgsfield job ID', type: 'string', readOnly: true },
          ],
          preview: {
            select: { title: 'label', subtitle: 'timeOfDay', media: 'asset' },
          },
        },
      ],
    ),
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers display first.',
    },
    {
      name: 'featuredOnHomepage',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
    },

    // ── Long-form content (portable text) ────────────────────────────
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Main description of the location — setting, history, occupants.',
    },
    {
      name: 'sensoryDetail',
      title: 'Sensory Detail',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Sight, sound, smell, atmosphere. How the location feels.',
    },
    {
      name: 'dramaticFunction',
      title: 'Dramatic Function',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'What this location does for the story — where which kinds of episodes live.',
    },
    {
      name: 'conflicts',
      title: 'Conflicts',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Recurring antagonists, threats, and dramatic tensions tied to this location.',
    },

    // ── Story hooks (array of custom objects) ────────────────────────
    {
      name: 'storyHooks',
      title: 'Story Hooks',
      type: 'array',
      description: 'Potential episode/book ideas anchored to this location.',
      of: [
        {
          type: 'object',
          name: 'storyHook',
          title: 'Story Hook',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'description' },
          },
        },
      ],
    },

    // ── Merch list (simple string array) ─────────────────────────────
    {
      name: 'merchandisePotential',
      title: 'Merchandise Potential',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Product ideas tied to this location.',
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'tagline',
      order: 'order',
    },
    prepare({ title, subtitle, order }) {
      return {
        title,
        subtitle: order != null ? `#${order} · ${subtitle || ''}` : subtitle,
      };
    },
  },

  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Title (A→Z)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
};
