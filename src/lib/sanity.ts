import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'o9qrmykx',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2026-04-10', useCdn: true,
});

const builder = imageUrlBuilder(client);
export function urlFor(source: any) { return builder.image(source); }

export async function getAllCharacters() {
  return client.fetch(`*[_type == "character"] | order(sortOrder asc) { _id, name, "slug": slug.current, role, bio, extendedBio, abilities, quote, portrait, galleryImages, sortOrder, seoTitle, seoDescription }`);
}
export async function getCharacterBySlug(slug: string) {
  return client.fetch(`*[_type == "character" && slug.current == $slug][0] { _id, name, "slug": slug.current, role, bio, extendedBio, abilities, quote, portrait, galleryImages, seoTitle, seoDescription }`, { slug });
}
export async function getAllEpisodes() {
  return client.fetch(`*[_type == "episode"] | order(publishedAt desc) { _id, title, "slug": slug.current, videoType, season, episodeNumber, youtubeUrl, youtubeId, thumbnail, description, "featuredCharacters": featuredCharacters[]->{ name, "slug": slug.current, portrait }, publishedAt, duration, featured, seoTitle, seoDescription }`);
}
export async function getFeaturedEpisodes() {
  return client.fetch(`*[_type == "episode" && featured == true] | order(publishedAt desc)[0...4] { _id, title, "slug": slug.current, videoType, youtubeUrl, youtubeId, thumbnail, description, publishedAt, duration }`);
}
export async function getAllBlogPosts() {
  return client.fetch(`*[_type == "blogPost"] | order(publishedAt desc) { _id, title, "slug": slug.current, category, excerpt, body, featuredImage, "relatedCharacters": relatedCharacters[]->{ name, "slug": slug.current }, publishedAt, seoTitle, seoDescription }`);
}
export async function getBlogPostBySlug(slug: string) {
  return client.fetch(`*[_type == "blogPost" && slug.current == $slug][0] { _id, title, "slug": slug.current, category, excerpt, body, featuredImage, "relatedCharacters": relatedCharacters[]->{ name, "slug": slug.current, portrait }, publishedAt, seoTitle, seoDescription }`, { slug });
}
export async function getAllProducts() {
  return client.fetch(`*[_type == "product"] | order(name asc) { _id, name, "slug": slug.current, "category": category->{ title, "slug": slug.current }, description, designStory, price, compareAtPrice, images, printfulVariants, material, featured, seoTitle, seoDescription }`);
}
export async function getProductBySlug(slug: string) {
  return client.fetch(`*[_type == "product" && slug.current == $slug][0] { _id, name, "slug": slug.current, "category": category->{ title, "slug": slug.current }, description, designStory, price, compareAtPrice, images, printfulVariants, material, featured, seoTitle, seoDescription }`, { slug });
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
