export function organizationSchema() {
  return { '@context': 'https://schema.org', '@type': 'Organization', name: 'Labrats', url: 'https://labrats.uk', logo: 'https://labrats.uk/favicon.png',
    description: 'Labrats is an animated sci-fi series following genetically enhanced lab rats fighting for freedom.',
    sameAs: ['https://www.youtube.com/@LabratsMedia', 'https://www.instagram.com/labratsmedia', 'https://www.tiktok.com/@labratsmedia', 'https://x.com/labratsmedia'],
    parentOrganization: { '@type': 'Organization', name: 'The Metavision Multimedia Limited', url: 'https://themetavision.co.uk' } };
}
export function websiteSchema() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Labrats', url: 'https://labrats.uk',
    description: 'Genetically enhanced. Dangerously smart. Fighting for their freedom. The Labrats animated series and book collection.',
    publisher: { '@type': 'Organization', name: 'Labrats' } };
}
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })) };
}
export function tvSeriesSchema() {
  return { '@context': 'https://schema.org', '@type': 'TVSeries', name: 'Labrats',
    description: 'An animated sci-fi series following a team of genetically enhanced lab rats who escape their facility and fight for freedom.',
    genre: ['Animation', 'Sci-Fi', 'Comedy'], url: 'https://labrats.uk',
    productionCompany: { '@type': 'Organization', name: 'The Metavision Multimedia Limited' } };
}
export function characterSchema(character: { name: string; bio: string; image?: string; url: string }) {
  return { '@context': 'https://schema.org', '@type': 'FictionalCharacter', name: character.name, description: character.bio, image: character.image, url: character.url,
    partOfSeries: { '@type': 'TVSeries', name: 'Labrats' } };
}
export function productSchema(product: { name: string; description: string; price: number; image?: string; url: string; availability?: string }) {
  return { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description, image: product.image, url: product.url,
    brand: { '@type': 'Brand', name: 'Labrats' },
    offers: { '@type': 'Offer', price: product.price, priceCurrency: 'GBP', availability: product.availability || 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Labrats' } } };
}
export function articleSchema(post: { title: string; excerpt: string; publishedAt: string; image?: string; url: string }) {
  return { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, datePublished: post.publishedAt, image: post.image, url: post.url,
    author: { '@type': 'Organization', name: 'Labrats' }, publisher: { '@type': 'Organization', name: 'The Metavision Multimedia Limited' } };
}
export function videoSchema(video: { title: string; description: string; youtubeId: string; publishedAt?: string; duration?: string; thumbnail?: string }) {
  return { '@context': 'https://schema.org', '@type': 'VideoObject', name: video.title, description: video.description,
    thumbnailUrl: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
    uploadDate: video.publishedAt, duration: video.duration, embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`, publisher: { '@type': 'Organization', name: 'Labrats' } };
}
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) };
}
export function collectionSchema(collection: { name: string; description: string; url: string; itemCount: number }) {
  return { '@context': 'https://schema.org', '@type': 'CollectionPage', name: collection.name, description: collection.description, url: collection.url, numberOfItems: collection.itemCount,
    isPartOf: { '@type': 'WebSite', name: 'Labrats', url: 'https://labrats.uk' } };
}
