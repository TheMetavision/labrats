import { defineType, defineField } from 'sanity';

/**
 * galleryImage: one private working or promo image.  [CROSS-BRAND]
 *
 * Used by character.referenceGallery, worldLocation.referenceGallery and
 * game.gameArt. These galleries are for Studio and the Social Content Studio
 * only: the website must never query them (no `{...}` spreads on character,
 * worldLocation or game).
 */
export const GALLERY_KINDS = [
  { title: 'Portrait', value: 'portrait' },
  { title: 'Pose (3D model pose or reference sheet)', value: 'pose' },
  { title: 'Vehicle (kart, bike)', value: 'vehicle' },
  { title: 'Model render (3D game model)', value: 'modelRender' },
  { title: 'Scene (character or location in a scene)', value: 'scene' },
  { title: 'Title card', value: 'titleCard' },
  { title: 'Title card, clean (no lettering)', value: 'titleCardClean' },
  { title: 'Level card (per level or track)', value: 'levelCard' },
  { title: 'Stage art (panorama, ground or sign art)', value: 'stageArt' },
  { title: 'Promo (made for socials)', value: 'promo' },
];

export default defineType({
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'What the image shows, e.g. "Axel in his trolley kart with wheels, sunset junkyard".',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: { list: GALLERY_KINDS },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'game', title: 'Game', type: 'string', description: 'e.g. "Vent Runner".' }),
    defineField({ name: 'level', title: 'Level', type: 'string', description: 'e.g. "Lab Zero".' }),
    defineField({ name: 'source', title: 'Source', type: 'string', description: 'Generator and job id, e.g. "Higgsfield gpt_image_2_6 / 586723bf-…".' }),
    defineField({
      name: 'approved',
      title: 'Approved for posts',
      type: 'boolean',
      initialValue: true,
      description: 'Untick to keep the image on file without using it in posts.',
    }),
    defineField({ name: 'notes', title: 'Notes', type: 'text', rows: 2 }),
  ],
  preview: {
    select: { caption: 'caption', kind: 'kind', game: 'game', media: 'asset' },
    prepare({ caption, kind, game, media }) {
      return { title: caption || 'Untitled image', subtitle: [kind, game].filter(Boolean).join(' · '), media };
    },
  },
});

/** Field definition shared by character and worldLocation. */
export function referenceGalleryField(description: string, extraMembers: any[] = []) {
  return defineField({
    name: 'referenceGallery',
    title: 'Reference gallery (private)',
    description,
    type: 'array',
    fieldset: 'referencePrivate',
    options: { layout: 'grid' },
    of: [{ type: 'galleryImage' }, ...extraMembers],
  });
}

/** The collapsed "Reference (private)" fieldset that holds referenceGallery. */
export const referencePrivateFieldset = {
  name: 'referencePrivate',
  title: 'Reference (private)',
  options: { collapsible: true, collapsed: true },
};
