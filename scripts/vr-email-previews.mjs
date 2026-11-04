/**
 * Renders every Vent Runner prize email with full sample data into an email-previews folder
 * and checks each one with the WCAG contrast test (tests/_email-contrast.mjs). Nothing is sent.
 *
 *   node scripts/vr-email-previews.mjs "C:\Users\chris\Documents\The Metavision\email-previews\labrats"
 *
 * Writes 34-44 (the old 34-36 Vent Runner previews are replaced) and updates that folder's index.html.
 * The disqualify links are signed with a preview-only secret unless VR_LEADERBOARD_SECRET is set,
 * so they don't work against the live site.
 */
import fs from 'node:fs';
import path from 'node:path';

process.env.VR_LEADERBOARD_SECRET ||= 'preview-only-secret-0123456789-abcdefghij';
for (const k of ['LOGO_URL', 'SITE_URL', 'BRAND_NAME', 'EMAIL_HEADER_BG', 'PRINTFUL_ORDERS_URL']) delete process.env[k];

const { vrEmailHtml } = await import('../netlify/lib/vr-email.mjs');
const E = await import('../netlify/lib/vr-prize-emails.mjs');
const { passDown } = await import('../netlify/lib/vr-prize.mjs');
const { contrastIssues } = await import('../tests/_email-contrast.mjs');

const out = process.argv[2];
if (!out || !fs.existsSync(out)) { console.error('Usage: node scripts/vr-email-previews.mjs <email-previews/labrats folder>'); process.exit(1); }

const NICKS = ['TurboGouda07', 'SneakyCheddar42', 'SwiftBrie11', 'ZippyEdam20', 'BoldNugget33', 'LuckyComet44', 'JollyPixel55', 'FizzyBolt66', 'SuperScout77', 'RocketPaws88'];
const DAY = 86400000, OFFERED = Date.UTC(2026, 10, 1, 1, 30);
const record = () => ({
  v: 2, month: '2026-10', status: 'open',
  candidates: NICKS.map((nick, i) => ({ rid: 'r' + i, nick, dist: 6420 - i * 215, score: 98000 - i * 3100, stage: ['ductways', 'labzero', 'vault'][i % 3], runner: i % 2 ? 'basil' : 'shadow', dev: 'd' + i, flag: i === 0, secs: 452 - i * 9 })),
  offer: { idx: 0, claimCode: 'K7MZ4QXP', offeredAt: OFFERED, deadline: Date.UTC(2026, 11, 1) }, claim: null, history: [], at: OFFERED,
});
const guardian = { name: 'Pat Parent', email: 'pat@example.com', a1: '1 Cheese Lane', a2: 'Flat 2', town: 'Southend-on-Sea', pc: 'SS1 1AA' };
const adult = { name: 'Ada Adult', email: 'ada@example.com', a1: '27 Byte Street', a2: '', town: 'Belfast', pc: 'BT1 5GS' };
const kidsTee = { design: 'boomer-blazeclaw-boom', name: 'Boomer Blazeclaw Boom', garment: 'kids-tshirt', garmentLabel: 'Kids T-shirt', colour: 'Azalea', size: 'M', syncVariantId: '5344612528' };
const adultTee = { design: 'byte-c-cheddar-hack-attack', name: 'Byte C Cheddar Hack Attack', garment: 'tshirt', garmentLabel: 'T-shirt', colour: 'Military Green', size: 'XL', syncVariantId: '5344613690' };

const passed = (reason, from = record(), at = OFFERED + 31 * DAY) => { const before = structuredClone(from); return { before, rec: passDown(from, reason, at) }; };
const claimedRec = () => { const r = record(); r.status = 'claimed'; r.claim = { idx: 0, claimCode: 'K7MZ4QXP', claimant: 'guardian', printfulOrderId: 118204417 }; r.offer = null; return r; };
const atIdx = (idx) => { const r = record(); r.offer = { idx, claimCode: 'HN3QW8RT', offeredAt: OFFERED + 31 * DAY, deadline: OFFERED + 45 * DAY }; return r; };
const lapsedFrom = () => { const r = record(); r.offer = { idx: 9, claimCode: 'P2LX9VZE', offeredAt: OFFERED, deadline: OFFERED + 14 * DAY }; return r; };

const PREVIEWS = [
  ['34-vent-runner-prize-claim-receipt-parent-guardian', 'Vent Runner prize claim receipt (parent or guardian)', 'c', E.receiptEmail({ rec: record(), idx: 0, claimant: 'guardian', f: guardian, prize: kidsTee })],
  ['35-vent-runner-monthly-winner', 'Vent Runner monthly winner (flagged run, top 10)', 't', E.monthCloseEmail({ rec: record() })],
  ['36-vent-runner-prize-claim-parent-guardian', 'Vent Runner prize claim (parent or guardian, Printful draft created, flagged)', 't', E.claimTeamEmail({ rec: record(), idx: 0, claimant: 'guardian', f: guardian, prize: kidsTee, draft: { ok: true, id: 118204417, existing: false, externalId: 'vr-2026-10-0' } })],
  ['37-vent-runner-prize-claim-receipt-winner', 'Vent Runner prize claim receipt (winner, 18 or over)', 'c', E.receiptEmail({ rec: record(), idx: 0, claimant: 'winner', f: adult, prize: adultTee })],
  ['38-vent-runner-prize-claim-winner-draft-already-there', 'Vent Runner prize claim (winner, passed down to #3, Printful draft already there)', 't', E.claimTeamEmail({ rec: atIdx(2), idx: 2, claimant: 'winner', f: adult, prize: adultTee, draft: { ok: true, id: 118204502, existing: true, externalId: 'vr-2026-10-2' } })],
  ['39-vent-runner-prize-claim-printful-failed', 'Vent Runner prize claim (Printful draft NOT created)', 't', E.claimTeamEmail({ rec: record(), idx: 0, claimant: 'guardian', f: guardian, prize: kidsTee, draft: { ok: false, error: 'Printful API 400: Recipient address is invalid (tried twice)', externalId: 'vr-2026-10-0' } })],
  ['40-vent-runner-prize-claim-receipt-passed-down-guardian', 'Vent Runner prize claim receipt (parent or guardian, prize passed down)', 'c', E.receiptEmail({ rec: atIdx(2), idx: 2, claimant: 'guardian', f: guardian, prize: kidsTee })],
  ['41-vent-runner-prize-passed-on-window-expired', 'Vent Runner prize passed on (claim window ran out)', 't', E.passDownEmail(passed('expired'))],
  ['42-vent-runner-prize-passed-on-cant-use-uk-address', "Vent Runner prize passed on (can't use a UK address)", 't', E.passDownEmail(passed('declined'))],
  ['43-vent-runner-prize-passed-on-disqualified-after-claim', 'Vent Runner prize passed on (disqualified after claiming)', 't', E.passDownEmail(passed('disqualified', claimedRec()))],
  ['44-vent-runner-prize-lapsed', 'Vent Runner prize lapsed (nobody in the top 10 claimed)', 't', E.passDownEmail(passed('expired', lapsedFrom()))],
];

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let failed = 0;
const items = { c: [], t: [] };
for (const old of ['34-vent-runner-prize-claim-receipt-parent-guardian.html', '35-vent-runner-monthly-winner.html', '36-vent-runner-prize-claim.html']) fs.rmSync(path.join(out, old), { force: true });
for (const [file, title, kind, mail] of PREVIEWS) {
  const html = vrEmailHtml({ html: mail.html, customer: !!mail.customer, title: mail.title || '' });
  const issues = contrastIssues(html);
  if (issues.length) { failed++; console.error(`CONTRAST FAIL ${file}:`, issues.slice(0, 5)); }
  fs.writeFileSync(path.join(out, file + '.html'), html);   // exactly what Resend is given, as the other previews
  items[kind].push(`<li><a href="${file}.html">${escHtml(title)}</a><br><small>Subject: ${escHtml(mail.subject)}</small><br><small>To: ${escHtml(mail.to)}</small></li>`);
  console.log(`${issues.length ? 'FAIL' : 'ok  '} ${file}.html`);
}

// index.html: drop the old Vent Runner entries, add these at the end of each list.
const idxPath = path.join(out, 'index.html');
if (fs.existsSync(idxPath)) {
  let idx = fs.readFileSync(idxPath, 'utf8');
  idx = idx.replace(/<li><a href="3[4-9]-vent-runner[^"]*">.*?<\/li>|<li><a href="4[0-9]-vent-runner[^"]*">.*?<\/li>/g, '');
  const parts = idx.split('</ul>');
  if (parts.length >= 3) {
    parts[0] += items.c.join('');
    parts[1] += items.t.join('');
    idx = parts.join('</ul>');
  }
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  idx = idx.replace(/(<p class="n">)(.*?)(<\/p>)/, (m, a, b, c) => `${a}${b.replace(/ Vent Runner emails \(34-44\) re-rendered.*$/, '')} Vent Runner emails (34-44) re-rendered ${stamp} UTC on branch feat/vr-prize-flow (disqualify links use a preview-only secret).${c}`);
  fs.writeFileSync(idxPath, idx);
}
if (failed) { console.error(`${failed} preview(s) failed the contrast check`); process.exit(1); }
console.log(`${PREVIEWS.length} previews written to ${out}; all pass the contrast check.`);
