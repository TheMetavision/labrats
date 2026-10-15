// POST /api/vr-claim  { month, claimCode, guardianName, email, address1, address2, town, postcode, size, consent }
// Sends the claim to contact@labrats.uk and a receipt to the parent/guardian. Personal details are NOT stored here,
// only the fact that the prize was claimed.
import { vrStore, json, readJson, rateLimited, esc, monthName, CONTACT_EMAIL } from '../lib/vr-shared.mjs';
import { sendEmail } from '../lib/vr-email.mjs';

const SIZES = ['Kids 3-4', 'Kids 5-6', 'Kids 7-8', 'Kids 9-11', 'Kids 12-14', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'];
const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const store = await vrStore();
  if (await rateLimited(store, req, context, 'claim', 10)) return json({ ok: false, reason: 'slow down' }, 429);
  const b = await readJson(req, 3000);
  if (!b || !/^\d{4}-\d{2}$/.test(b.month) || b.consent !== true) return json({ ok: false, reason: 'form' }, 400);
  const f = { name: str(b.guardianName, 80), email: str(b.email, 120), a1: str(b.address1, 120), a2: b.address2 ? str(b.address2, 120) : '', town: str(b.town, 80), pc: str(b.postcode, 12), size: SIZES.includes(b.size) ? b.size : null };
  if (!f.name || !f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !f.a1 || !f.town || !f.pc || !f.size || f.a2 === null) return json({ ok: false, reason: 'form' }, 400);
  const key = `winners/${b.month}`;
  const cur = await store.getWithMetadata(key, { type: 'json' });
  const w = cur && cur.data;
  if (!w || w.disqualified || typeof b.claimCode !== 'string' || b.claimCode.toUpperCase() !== w.claimCode) return json({ ok: false, reason: 'code' }, 400);
  if (w.claimed) return json({ ok: false, reason: 'claimed' }, 409);
  const res = await store.setJSON(key, { ...w, claimed: true, claimedAt: Date.now() }, { onlyIfMatch: cur.etag });
  if (res && res.modified === false) return json({ ok: false, reason: 'busy' }, 409);
  const month = monthName(b.month);
  await sendEmail({
    to: CONTACT_EMAIL, replyTo: f.email,
    subject: `Vent Runner prize claim: ${month} (${w.nick})`,
    html: `<h2>Vent Runner prize claim: ${esc(month)}</h2>
      <p><b>Winner:</b> ${esc(w.nick)}, ${w.dist.toLocaleString('en-GB')} m on ${esc(w.stage)} as ${esc(w.runner)}${w.flag ? ' <b>(flagged for review: run was close to the fastest possible time)</b>' : ''}</p>
      <p><b>Parent/guardian:</b> ${esc(f.name)}<br><b>Email:</b> ${esc(f.email)}<br><b>T-shirt size:</b> ${esc(f.size)}</p>
      <p><b>Deliver to:</b><br>${esc(f.a1)}<br>${f.a2 ? esc(f.a2) + '<br>' : ''}${esc(f.town)}<br>${esc(f.pc)}</p>
      <p>Consent confirmed: claimant states they are the parent or guardian (18+) and agrees to the leaderboard terms.</p>
      <p>Delete these details once the prize has been sent.</p>`,
  });
  await sendEmail({
    to: f.email,
    subject: 'Your Labrats Vent Runner prize claim',
    html: `<p>Hi ${esc(f.name)},</p><p>Thanks for claiming the ${esc(month)} Vent Runner leaderboard prize for <b>${esc(w.nick)}</b>. We'll check the winning run and post the t-shirt (size ${esc(f.size)}) within 28 days.</p><p>We only use these details to send the prize, and delete them once it has been sent.</p><p>The Labrats team</p>`,
  });
  return json({ ok: true });
};
