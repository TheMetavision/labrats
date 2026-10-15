// Scheduled: runs early on the 1st of each month (UTC). Picks last month's furthest run, creates a claim code,
// and emails a summary (top 10, flags) to contact@labrats.uk so the winner can be checked before the prize goes out.
import { vrStore, prevMonthId, monthId, claimCode, esc, monthName, CONTACT_EMAIL, KEEP_MONTHS } from '../lib/vr-shared.mjs';
import { sendEmail } from '../lib/vr-email.mjs';

// Housekeeping: nothing builds up forever. Old run tickets and anti-spam counters go, and monthly boards
// older than KEEP_MONTHS are deleted. Winner records hold no personal details and are kept as the prize history.
export async function tidy(store, now = new Date()) {
  const keys = async prefix => { const out = []; for await (const page of store.list({ prefix, paginate: true })) out.push(...page.blobs.map(b => b.key)); return out; };
  const thisMonth = monthId(now), hourNow = Math.floor(now.getTime() / 3600000);
  let removed = 0;
  for (const k of await keys('used/')) if (k.split('/')[1] < thisMonth) { await store.delete(k); removed++; }
  for (const k of await keys('rl/')) if (+k.split('/')[1] < hourNow - 2) { await store.delete(k); removed++; }
  const [y, m] = thisMonth.split('-').map(Number), cut = new Date(Date.UTC(y, m - 1 - KEEP_MONTHS, 1)), oldest = cut.getUTCFullYear() + '-' + String(cut.getUTCMonth() + 1).padStart(2, '0');
  for (const k of await keys('board/')) { const id = k.slice(6); if (/^\d{4}-\d{2}$/.test(id) && id < oldest) { await store.delete(k); removed++; } }
  return removed;
}

export async function closeMonth(now = new Date()) {
  const month = prevMonthId(now), store = await vrStore();
  await tidy(store, now);
  const board = await store.get(`board/${month}`, { type: 'json' });
  const entries = board ? board.entries : [];
  if (!entries.length) return { month, winner: null };
  const top = entries[0];
  const rec = { month, rid: top.rid, nick: top.nick, dist: top.dist, score: top.score, stage: top.stage, runner: top.runner, dev: top.dev, flag: top.flag, secs: top.secs, claimCode: claimCode(), claimed: false, at: Date.now() };
  const res = await store.setJSON(`winners/${month}`, rec, { onlyIfNew: true });
  if (res && res.modified === false) return { month, winner: 'already closed' };
  const rows = entries.slice(0, 10).map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.nick)}</td><td>${e.dist.toLocaleString('en-GB')} m</td><td>${esc(e.stage)}</td><td>${esc(e.runner)}</td><td>${Math.floor(e.secs / 60)}m ${e.secs % 60}s</td><td>${e.flag ? 'CHECK' : ''}</td></tr>`).join('');
  await sendEmail({
    to: CONTACT_EMAIL,
    subject: `Vent Runner leaderboard: ${monthName(month)} winner is ${top.nick}`,
    html: `<h2>Vent Runner: ${esc(monthName(month))}</h2>
      <p><b>Winner:</b> ${esc(top.nick)}, ${top.dist.toLocaleString('en-GB')} m. Claim code: <b>${rec.claimCode}</b></p>
      <p>The winner sees a "You won!" message next time they open the game on the same device, and a parent or guardian claims at labrats.uk/games/claim/. You'll get a second email with their delivery details.</p>
      ${top.flag ? '<p><b>The winning run is flagged:</b> it finished close to the fastest physically possible time. Check it before sending the prize.</p>' : ''}
      <table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>#</th><th>Nickname</th><th>Distance</th><th>Stage</th><th>Runner</th><th>Run time</th><th>Flag</th></tr>${rows}</table>`,
  });
  return { month, winner: rec.nick };
}

export default async () => { await closeMonth(); return new Response('ok'); };
export const config = { schedule: '30 1 1 * *' };
