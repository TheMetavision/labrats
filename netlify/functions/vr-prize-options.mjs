// GET /api/vr-prize-options  ->  { designs: [{ slug, name, garments: [{ type, label, colours: [{ colour, image, sizes }] }] }] }
// The T-shirts a Vent Runner prize can be: every active Labrats design with T-shirt (and, where it has them,
// kids T-shirt) variants, built only from its real Printful variants (netlify/lib/vr-prize.mjs). Read only.
import { json } from '../lib/vr-shared.mjs';
import { sanityRead, PRIZE_QUERY, prizeDesigns } from '../lib/vr-prize.mjs';

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  try {
    return json({ designs: prizeDesigns(await sanityRead(PRIZE_QUERY)) }, 200, { 'cache-control': 'public, max-age=300' });
  } catch (e) {
    console.error('[VR-PRIZE] options failed:', e.message);
    return json({ designs: [], error: 'unavailable' }, 503);
  }
};
