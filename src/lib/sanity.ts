import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// perspective:'published' — keeps drafts out of the static build even though a
// token is present (same fix as the Fuglys double-listing bug).
export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'o9qrmykx',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01', useCdn: true,
  token: import.meta.env.SANITY_API_TOKEN,
  perspective: 'published',
});

// Non-CDN client for content that needs fresh reads (e.g. legal pages)
export const liveClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'o9qrmykx',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01', useCdn: false,
  token: import.meta.env.SANITY_API_TOKEN,
  perspective: 'published',
});

const builder = imageUrlBuilder(client);
export function urlFor(source: any) { return builder.image(source); }

export async function getAllCharacters() {
  return client.fetch(`*[_type == "character"] | order(sortOrder asc) { _id, name, "slug": slug.current, role, bio, extendedBio, abilities, quote, "portrait": coalesce(image, portrait), galleryImages, sortOrder, seoTitle, seoDescription }`);
}
export async function getCharacterBySlug(slug: string) {
  return client.fetch(`*[_type == "character" && slug.current == $slug][0] { _id, name, "slug": slug.current, role, bio, extendedBio, abilities, quote, "portrait": coalesce(image, portrait), galleryImages, seoTitle, seoDescription }`, { slug });
}
export async function getAllEpisodes() {
  return client.fetch(`*[_type == "episode"] | order(publishedAt desc) { _id, title, "slug": slug.current, videoType, season, episodeNumber, youtubeUrl, youtubeId, thumbnail, description, "featuredCharacters": featuredCharacters[]->{ name, "slug": slug.current, "portrait": coalesce(image, portrait) }, publishedAt, duration, featured, seoTitle, seoDescription }`);
}
export async function getFeaturedEpisodes() {
  return client.fetch(`*[_type == "episode" && featured == true] | order(publishedAt desc)[0...4] { _id, title, "slug": slug.current, videoType, youtubeUrl, youtubeId, thumbnail, description, publishedAt, duration }`);
}
export async function getAllBlogPosts() {
  return client.fetch(`*[_type == "blogPost"] | order(publishedAt desc) { _id, title, "slug": slug.current, category, excerpt, body, featuredImage, "relatedCharacters": relatedCharacters[]->{ name, "slug": slug.current }, publishedAt, seoTitle, seoDescription }`);
}
export async function getBlogPostBySlug(slug: string) {
  return client.fetch(`*[_type == "blogPost" && slug.current == $slug][0] { _id, title, "slug": slug.current, category, excerpt, body, featuredImage, "relatedCharacters": relatedCharacters[]->{ name, "slug": slug.current, "portrait": coalesce(image, portrait) }, publishedAt, seoTitle, seoDescription }`, { slug });
}

// ── Products (NESTED commerce model — one design doc holds variants[]) ──────
export async function getAllProducts() {
  return client.fetch(`
    *[_type == "product" && active == true] | order(coalesce(sortOrder, 999), name asc) {
      _id,
      name,
      "slug": slug.current,
      active,
      "category": category->{ title, "slug": slug.current },
      "featuredCharacter": featuredCharacter->{ name, "slug": slug.current },
      description,
      designStory,
      tagline,
      backstory,
      accent,
      heroImage,
      featured,
      seoTitle,
      seoDescription,
      "price": coalesce(price, variants[0].basePrice),
      compareAtPrice,
      variants[]{
        productType,
        label,
        basePrice,
        colours,
        sizes,
        sizePrices[]{ size, price },
        colourImages[]{ colour, imageUrl },
        printfulVariants[]{ size, colour, syncVariantId }
      }
    }
  `);
}
export async function getProductBySlug(slug: string) {
  return client.fetch(`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      active,
      "category": category->{ title, "slug": slug.current },
      "featuredCharacter": featuredCharacter->{ name, "slug": slug.current, "portrait": coalesce(image, portrait) },
      description,
      designStory,
      tagline,
      backstory,
      accent,
      heroImage,
      featured,
      seoTitle,
      seoDescription,
      "price": coalesce(price, variants[0].basePrice),
      compareAtPrice,
      variants[]{
        productType,
        label,
        basePrice,
        colours,
        sizes,
        sizePrices[]{ size, price },
        colourImages[]{ colour, imageUrl },
        printfulVariants[]{ size, colour, syncVariantId },
        stripePriceId
      }
    }
  `, { slug });
}
export async function getAllCategories() {
  return client.fetch(`*[_type == "category"] | order(sortOrder asc) { _id, title, "slug": slug.current, description, image, sortOrder }`);
}
export async function getAllFaqs() {
  return client.fetch(`*[_type == "faq"] | order(order asc) { _id, question, answer, category, order }`);
}
export async function getPageBySlug(slug: string) {
  return client.fetch(`*[_type == "page" && slug.current == $slug][0] { _id, title, "slug": slug.current, body, noIndex, seoTitle, seoDescription }`, { slug });
}
export async function getSiteSettings() {
  return client.fetch(`*[_type == "siteSettings"][0] { siteName, tagline, siteDescription, contactEmail, youtubeChannel, socialLinks, announcementBar, logo, footerLogo, footerText, newsletterHeadline, newsletterSubtext, heroImage, heroPortrait, bookPromoImage, trailerYoutubeUrl, storeOpenDate }`);
}
export async function getAllBooks() {
  return client.fetch(`*[_type == "book"] | order(seriesOrder asc) { _id, title, "slug": slug.current, description, coverImage, orderUrl, seriesOrder, ageRange, pageCount, isbn, publishedAt, seoTitle, seoDescription }`);
}
export async function getBookBySlug(slug: string) {
  return client.fetch(`*[_type == "book" && slug.current == $slug][0] { _id, title, "slug": slug.current, description, coverImage, orderUrl, seriesOrder, ageRange, pageCount, isbn, publishedAt, seoTitle, seoDescription }`, { slug });
}

// ─── Theme audio (added 2026-04-29 for the IP brand theme-tune feature) ──────
// Pinned to _id == "siteSettings" so it only ever reads the canonical singleton.
// Returns null if the singleton has no MP3 uploaded yet OR if themeEnabled is
// explicitly false — both render-blocking states the LabratsAudioLog component
// safely handles by rendering nothing.
export interface ThemeAudio {
  audioUrl: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  enabled: boolean;
}
export async function getThemeAudio(): Promise<ThemeAudio> {
  const result = await client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
    "audioUrl": themeAudioFile.asset->url,
    "trackTitle": themeTrackTitle,
    "trackArtist": themeTrackArtist,
    "enabled": themeEnabled
  }`);
  return {
    audioUrl: result?.audioUrl ?? null,
    trackTitle: result?.trackTitle ?? 'Labrats Main Theme',
    trackArtist: result?.trackArtist ?? '',
    enabled: result?.enabled !== false, // null treated as enabled (kill switch must be explicit false to disable)
  };
}
