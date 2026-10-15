// POST /api/vr-winner  { month, deviceKey }  ->  { won, claimCode?, nick?, dist?, claimed? }
// Only the device that set the winning run can see its claim code (it proves this with the secret key whose hash is on the run).
import { vrStore, sha256, json, readJson, rateLimited } from '../lib/vr-shared.mjs';

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await readJson(req, 400);
  if (!body || !/^\d{4}-\d{2}$/.test(body.month) || typeof body.deviceKey !== 'string' || !/^[a-f0-9]{64}$/.test(body.deviceKey)) return json({ won: false });
  const store = await vrStore();
  if (await rateLimited(store, req, context, 'winner', 60)) return json({ won: false });
  const w = await store.get(`winners/${body.month}`, { type: 'json' });
  if (!w || w.dev !== sha256(body.deviceKey) || w.disqualified) return json({ won: false });
  return json({ won: true, month: body.month, claimCode: w.claimCode, nick: w.nick, dist: w.dist, claimed: !!w.claimed });
};
