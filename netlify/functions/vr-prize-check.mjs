// Scheduled daily: every Vent Runner prize offer whose claim window has run out passes to the next player
// (netlify/lib/vr-prize.mjs: 30 days after the month for the winner, 14 days for each next player, down the
// top 10), and the team gets an email for each one.
import { vrStore } from '../lib/vr-shared.mjs';
import { sendEmail } from '../lib/vr-email.mjs';
import { expireDue } from '../lib/vr-prize.mjs';
import { passDownEmail } from '../lib/vr-prize-emails.mjs';

export async function checkWindows(now = Date.now()) {
  const store = await vrStore();
  const done = await expireDue(store, now);
  for (const d of done) await sendEmail(passDownEmail(d)).catch((e) => console.error(`[VR-PRIZE] ${d.month}: pass-down email failed:`, e.message));
  return done.map((d) => ({ month: d.month, status: d.rec.status, idx: d.rec.offer ? d.rec.offer.idx : null }));
}

export default async () => { const r = await checkWindows(); console.log('[VR-PRIZE] window check:', JSON.stringify(r)); return new Response('ok'); };
export const config = { schedule: '15 6 * * *' };
