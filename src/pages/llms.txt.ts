// llms.txt, built from Sanity at build time so the cast always matches the
// character documents. The Rat Pack is the characters both type fields mark as
// heroes (characterType and tag disagree on a few); everyone else is listed
// under villains and rivals.
import type { APIRoute } from 'astro';
import { client } from '../lib/sanity';

type Character = { name: string; role?: string; bio?: string; characterType?: string; tag?: string };

/** First sentence of the bio, so each line stays short. */
const firstSentence = (s = '') => (s.replace(/\s+/g, ' ').trim().match(/^.+?[.!?](?=\s|$)/) || [s.trim()])[0];
const line = (c: Character) => `- **${c.name}**${c.role ? ` — ${c.role}.` : ''}${c.bio ? ` ${firstSentence(c.bio)}` : ''}`;

export const GET: APIRoute = async () => {
  const characters: Character[] = await client.fetch(
    `*[_type == "character" && defined(name)] | order(sortOrder asc) { name, role, bio, characterType, tag }`
  );
  // Fail the build (Netlify keeps the live deploy) rather than publish an empty cast.
  if (!characters?.length) throw new Error('[llms.txt] Sanity returned no characters');
  const isHero = (c: Character) => c.characterType === 'hero' && c.tag === 'hero';
  const heroes = characters.filter(isHero);
  const villains = characters.filter((c) => !isHero(c));

  const body = `# Labrats

> Where Genius Meets Mischief!

Labrats is an animated sci-fi series and book universe created by The Metavision Multimedia Limited. It follows a team of genetically enhanced lab rats who escape their facility and fight for freedom.

## The Series

The Labrats animated series blends sci-fi action with dark comedy, following the Rat Pack as they navigate a world that created them but can't control them. Available on YouTube with companion books expanding the universe.

## The Rat Pack

${heroes.map(line).join('\n')}
${villains.length ? `\n## Villains and Rivals\n\n${villains.map(line).join('\n')}\n` : ''}
## Official Merch

Labrats merch features character apparel, collectibles, accessories, and art prints — all available at labrats.uk/merch.

## Links

- Website: https://labrats.uk
- YouTube: https://www.youtube.com/@LabratsMedia
- Instagram: https://www.instagram.com/labratsmedia
- TikTok: https://www.tiktok.com/@labratsmedia
- X (Twitter): https://x.com/labratsmedia
- Blog: https://labrats.uk/rat-tales

## Parent Company

Labrats is a brand of The Metavision Multimedia Limited, a UK-based AI creative agency. Learn more at https://themetavision.co.uk

- Legal name: The Metavision Multimedia Limited (Labrats is a trading name)
- Company no.: 16282479 (registered in England & Wales)
- Registered office: 167-169 Great Portland Street, 5th Floor, London, W1W 5PF
- VAT no.: GB 503 7530 17
- Contact: squeak@labrats.uk
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
