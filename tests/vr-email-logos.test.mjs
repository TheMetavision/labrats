/**
 * Vent Runner leaderboard emails carry the Labrats logo (labrats only).
 * The month close and a prize claim run end to end on an in-memory Blobs store
 * (as netlify/tests/vr-leaderboard.test.mjs does); fetch is stubbed, so the
 * Resend payloads are recorded and nothing is sent. LOGO_URL is not set, so the
 * logo has to come from site-config. Every one of them must also be readable (WCAG
 * contrast, tests/_email-contrast.mjs); the winning run is close to the fastest possible
 * time, so the team emails carry their "flagged" warnings too.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setStoreForTests, monthId, sha256, signTicket } from '../netlify/lib/vr-shared.mjs';
import { SITE_CONFIG } from '../netlify/functions/_shared/site-config.mjs';
import { esc } from '../netlify/functions/_shared/dispatch-email.mjs';
import { assertReadable } from './_email-contrast.mjs';

const LOGO = 'https://labrats.uk/labrats-email-logo.png';
const FOREIGN = ['thefuglys', 'catsoncrack', 'cats on crack', 'bikerbabies', 'biker babies', 'v518t53u', 'wyrmfuel', 'pixel8multimedia', 'comicstripcanvas', 'dottyandfriends', 'metavision'];

process.env.VR_LEADERBOARD_SECRET = 'test-secret-0123456789-abcdefghijklmnop';
delete process.env.LOGO_URL;
const mem = new Map(); let n = 0;
setStoreForTests({
  async get(k) { const v = mem.get(k); return v ? JSON.parse(v.d) : null; },
  async getWithMetadata(k) { const v = mem.get(k); return v ? { data: JSON.parse(v.d), etag: v.e } : null; },
  async setJSON(k, val, o = {}) {
    const cur = mem.get(k);
    if (o.onlyIfNew && cur) return { modified: false };
    if (o.onlyIfMatch && (!cur || cur.e !== o.onlyIfMatch)) return { modified: false };
    mem.set(k, { d: JSON.stringify(val), e: 'e' + (++n) }); return { modified: true, etag: 'e' + n };
  },
  async *list({ prefix }) { yield { blobs: [...mem.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  async delete(k) { mem.delete(k); },
});
const sent = [];
// Resend is recorded; the prize claim also reads the T-shirt from Sanity and makes a Printful draft (faked here).
const PRODUCT = { name: 'Boomer Blazeclaw Boom', slug: 'boomer', variants: [{ productType: 'kids-tshirt', printfulVariants: [{ colour: 'Black', size: 'M', syncVariantId: '6001' }] }] };
process.env.PRINTFUL_API_KEY = 'pf_test';
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.hostname === 'api.resend.com') { sent.push(JSON.parse(init.body)); return new Response('{"id":"x"}', { status: 200 }); }
  if (u.hostname.endsWith('api.sanity.io')) return new Response(JSON.stringify({ result: PRODUCT }), { status: 200 });
  if (u.hostname === 'api.printful.com') return new Response(JSON.stringify({ result: { id: 555 } }), { status: 200 });
  throw new Error('unexpected network call ' + url);
};

const submit = (await import('../netlify/functions/vr-submit.mjs')).default;
const winner = (await import('../netlify/functions/vr-winner.mjs')).default;
const claim = (await import('../netlify/functions/vr-claim.mjs')).default;
const { closeMonth } = await import('../netlify/functions/vr-close-month.mjs');
const { vrEmailHtml } = await import('../netlify/lib/vr-email.mjs');
const post = (fn, body, ip = '1.1.1.1') => fn(new Request('https://x/api', { method: 'POST', body: JSON.stringify(body), headers: { 'x-nf-client-connection-ip': ip } }), { ip });

function assertLabratsLogo(html, label) {
  assert.ok(html.includes(`src="${esc(LOGO)}"`), `${label}: has the Labrats logo`);
  const lower = html.toLowerCase();
  for (const m of FOREIGN) assert.ok(!lower.includes(m), `${label}: must not contain ${m}`);
}

test('the Labrats site-config logo is the one expected', () => {
  assert.equal(SITE_CONFIG.LOGO_URL, LOGO);
  assert.equal(process.env.LOGO_URL, undefined);
});

test('month close, prize claim and receipt: Labrats logo on all three; team bar vs customer card', async () => {
  const key = 'b'.repeat(64);
  const ticket = signTicket({ rid: 'r1', t: Date.now() - 90 * 1000, stage: 'ductways', runner: 'shadow', dev: sha256(key) });
  const r = await (await post(submit, { token: ticket, nick: 'TurboGouda07', dist: 2600, score: 100 })).json();
  assert.ok(r.ok, JSON.stringify(r));
  const [y, m] = monthId().split('-').map(Number);
  await closeMonth(new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 2)));
  const month = monthId();
  const w = await (await post(winner, { month, deviceKey: key })).json();
  assert.ok(w.won, 'winner sees the claim code');
  const cr = await (await post(claim, { month, claimCode: w.claimCode, claimant: 'guardian', name: 'Pat Parent', email: 'pat@example.com', address1: '1 Cheese Lane', town: 'Southend-on-Sea', postcode: 'SS1 1AA', design: 'boomer', garment: 'kids-tshirt', colour: 'Black', size: 'M', consent: true }, '2.2.2.2')).json();
  assert.ok(cr.ok, JSON.stringify(cr));
  assert.equal(sent.length, 3);
  const [summary, claimMail, receipt] = sent;

  for (const [mail, label, heading] of [[summary, 'monthly winner', 'Vent Runner:'], [claimMail, 'prize claim', 'Vent Runner prize claim']]) {
    assert.equal(mail.to, 'contact@labrats.uk');
    assertLabratsLogo(mail.html, label);
    assert.ok(mail.html.includes('width="160"'), `${label}: the small team logo bar`);
    assert.ok(mail.html.includes(`background:${esc(SITE_CONFIG.EMAIL_HEADER_BG)}`), `${label}: bar uses EMAIL_HEADER_BG`);
    assert.ok(mail.html.indexOf(esc(LOGO)) < mail.html.indexOf(heading), `${label}: logo above the heading`);
  }

  assert.equal(receipt.to, 'pat@example.com');
  assertLabratsLogo(receipt.html, 'receipt');
  assert.match(summary.html, /flagged/, 'monthly winner: the flag warning is shown');
  assert.match(claimMail.html, /flagged for review/, 'prize claim: the flag warning is shown');
  for (const [mail, label] of [[summary, 'monthly winner'], [claimMail, 'prize claim'], [receipt, 'receipt']]) assertReadable(mail.html, `Vent Runner ${label}`);
  assert.ok(receipt.html.includes('width="240"'), 'receipt: the customer card header');
  assert.ok(receipt.html.startsWith('<!doctype html>'), 'receipt: a full customer email');
  assert.ok(receipt.html.includes('Prize claim received'));
  assert.ok(receipt.html.indexOf(esc(LOGO)) < receipt.html.indexOf('Hi Pat Parent'), 'receipt: logo above the greeting');
});

test('vrEmailHtml follows a LOGO_URL override and falls back to the name with no logo', () => {
  const b = (logo) => ({ logo, name: 'Labrats', accent: '#ff0000', headerBg: '#000000', pageBg: '#fff', cardBg: '#fff', text: '#222', heading: '#000', muted: '#777', rule: '#ddd', site: 'https://labrats.uk', host: 'labrats.uk' });
  assert.ok(vrEmailHtml({ html: '<p>x</p>' }, b('https://example.com/l.png')).includes('src="https://example.com/l.png"'));
  assert.ok(vrEmailHtml({ html: '<p>x</p>', customer: true, title: 'T' }, b('https://example.com/l.png')).includes('src="https://example.com/l.png"'));
  assert.doesNotMatch(vrEmailHtml({ html: '<p>x</p>' }, b('')), /<img/);
  // Readable whatever the palette: the wordmark and card text follow readable-colour.mjs.
  assertReadable(vrEmailHtml({ html: '<p>x</p>' }, b('')), 'team, no logo');
  assertReadable(vrEmailHtml({ html: '<p>x</p>', customer: true, title: 'T' }, b('')), 'customer, no logo');
});
