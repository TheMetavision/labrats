// Tests for the server-side GA4 purchase (src/lib/ga4-purchase.cjs), the
// webhook's brand guard and the checkout's GA metadata. Nothing leaves the
// machine: fetch and Stripe are stubbed.
//
//   npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
require.cache[require.resolve('stripe')] = { exports: () => ({}) };

const { sendPurchase, buildPurchasePayload } = require('../src/lib/ga4-purchase.cjs');
const { isLabratsSession } = require('../netlify/functions/stripe-webhook.cjs');
const { gaMetadata } = require('../netlify/functions/create-checkout.cjs');

const ENV = { GA4_MEASUREMENT_ID: 'G-TEST', GA4_API_SECRET: 'secret' };

// £25 tee x2 with £5 off the line, £46.99 canvas, £6.95 shipping → £98.94 charged.
const session = (over = {}) => ({
  id: 'cs_live_abc123',
  livemode: true,
  currency: 'gbp',
  amount_total: 9894,
  shipping_cost: { amount_total: 695 },
  total_details: { amount_shipping: 695, amount_tax: 0, amount_discount: 500 },
  metadata: { brand: 'labrats', ga_client_id: '123456789.1700000000', ga_session_id: '1700000000' },
  ...over,
});

const product = (metadata) => ({ id: 'prod_x', object: 'product', metadata });
const LINE_ITEMS = {
  data: [
    {
      id: 'li_1', description: 'Outranked T-Shirt — Black (M)', quantity: 2,
      amount_subtotal: 5000, amount_discount: 500, amount_tax: 0, amount_total: 4500,
      price: { product: product({ printful_variant_id: '101', labrats_size: 'M', labrats_colour: 'Black', slug: 'outranked', product_type: 'tshirt' }) },
    },
    {
      id: 'li_2', description: 'Frankenstein — Canvas', quantity: 1,
      amount_subtotal: 4699, amount_discount: 0, amount_tax: 0, amount_total: 4699,
      price: { product: product({ fulfilment: 'inhouse', wallart_slug: 'labrats-frankenstein', wallart_format: 'canvas-gallery', wallart_size: 'large', slug: 'labrats-frankenstein', product_type: 'wallart' }) },
    },
  ],
};

function recorder(ok = true) {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { ok, status: ok ? 204 : 500 }; };
  return { calls, fetchImpl };
}

/* ── skips ─────────────────────────────────────────────────────────────── */

test('skips without GA4 env vars', async () => {
  for (const env of [{}, { GA4_MEASUREMENT_ID: 'G-TEST' }, { GA4_API_SECRET: 'secret' }]) {
    const r = recorder();
    const res = await sendPurchase(session(), { env, lineItems: LINE_ITEMS, fetchImpl: r.fetchImpl });
    assert.deepEqual(res, { sent: false, reason: 'not-configured' });
    assert.equal(r.calls.length, 0);
  }
});

test('skips without a valid ga_client_id', async () => {
  for (const metadata of [{ brand: 'labrats' }, { ga_client_id: '' }, { ga_client_id: 'abc.def' }, { ga_client_id: '12345' }]) {
    const r = recorder();
    const res = await sendPurchase(session({ metadata }), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: r.fetchImpl });
    assert.equal(res.reason, 'no-client-id');
    assert.equal(r.calls.length, 0);
  }
});

test('skips test-mode sessions', async () => {
  const r = recorder();
  const res = await sendPurchase(session({ livemode: false }), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: r.fetchImpl });
  assert.equal(res.reason, 'test-mode');
  assert.equal(r.calls.length, 0);
});

test('skips a Stripe retry whose order was already recorded', async () => {
  const r = recorder();
  const res = await sendPurchase(session(), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: r.fetchImpl, alreadyRecorded: async () => true });
  assert.equal(res.reason, 'already-recorded');
  assert.equal(r.calls.length, 0);
});

/* ── never throws ──────────────────────────────────────────────────────── */

test('never throws: fetch rejects, GA errors, bad input, Stripe lookup fails', async () => {
  const boom = async () => { throw new Error('network down'); };
  assert.equal((await sendPurchase(session(), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: boom })).sent, false);
  assert.equal((await sendPurchase(session(), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: recorder(false).fetchImpl })).reason, 'http-500');
  assert.equal((await sendPurchase(null, { env: ENV })).sent, false);
  assert.equal((await sendPurchase(session(), { env: ENV, alreadyRecorded: boom, fetchImpl: recorder().fetchImpl })).sent, false);
  const stripe = { checkout: { sessions: { listLineItems: boom } } };
  assert.equal((await sendPurchase(session(), { env: ENV, stripe, fetchImpl: recorder().fetchImpl })).sent, false);
});

test('times out instead of hanging the webhook', async () => {
  const hang = (_url, init) => new Promise((_res, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
  const started = Date.now();
  const res = await sendPurchase(session(), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: hang, timeoutMs: 50 });
  assert.equal(res.reason, 'timeout');
  assert.ok(Date.now() - started < 1000);
});

/* ── payload ───────────────────────────────────────────────────────────── */

test('sends one purchase: value excludes shipping, discounted item prices', async () => {
  const r = recorder();
  const res = await sendPurchase(session(), { env: ENV, lineItems: LINE_ITEMS, fetchImpl: r.fetchImpl });
  assert.deepEqual(res, { sent: true, reason: 'ok' });
  assert.equal(r.calls.length, 1);
  assert.match(r.calls[0].url, /^https:\/\/www\.google-analytics\.com\/mp\/collect\?measurement_id=G-TEST&api_secret=secret$/);

  const body = r.calls[0].body;
  assert.equal(body.client_id, '123456789.1700000000');
  assert.deepEqual(body.consent, { ad_user_data: 'DENIED', ad_personalization: 'DENIED' });
  const p = body.events[0].params;
  assert.equal(body.events[0].name, 'purchase');
  assert.equal(p.transaction_id, 'cs_live_abc123');
  assert.equal(p.currency, 'GBP');
  assert.equal(p.value, 91.99); // 98.94 charged - 6.95 shipping
  assert.equal(p.shipping, 6.95);
  assert.equal(p.tax, 0);
  assert.equal(p.engagement_time_msec, 1);
  assert.equal(p.session_id, '1700000000');
  assert.deepEqual(p.items[0], {
    item_id: 'outranked', item_name: 'Outranked T-Shirt — Black (M)', item_category: 'tshirt',
    item_variant: 'Black / M', price: 22.5, quantity: 2, discount: 2.5,
  });
  assert.equal(p.items[1].item_id, 'labrats-frankenstein');
  assert.equal(p.items[1].item_category, 'wallart');
  assert.equal(p.items[1].item_variant, 'canvas-gallery / large');
  assert.equal(p.items[1].price, 46.99);
  assert.equal(p.items[1].discount, undefined);
  // Items add up to the value.
  assert.equal(Math.round(p.items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100, p.value);
});

test('value without shipping_cost falls back to total_details.amount_shipping', () => {
  const p = buildPurchasePayload(session({ shipping_cost: null }), LINE_ITEMS).events[0].params;
  assert.equal(p.value, 91.99);
});

test('session_id is only included when valid', () => {
  const withMeta = (ga_session_id) => session({ metadata: { ga_client_id: '1.2', ga_session_id } });
  assert.equal(buildPurchasePayload(withMeta(undefined), LINE_ITEMS).events[0].params.session_id, undefined);
  assert.equal(buildPurchasePayload(withMeta('abc'), LINE_ITEMS).events[0].params.session_id, undefined);
  assert.equal(buildPurchasePayload(withMeta('1'.repeat(21)), LINE_ITEMS).events[0].params.session_id, undefined);
  assert.equal(buildPurchasePayload(withMeta('42'), LINE_ITEMS).events[0].params.session_id, '42');
});

test('lists line items from Stripe when the webhook has none', async () => {
  const r = recorder();
  const stripe = { checkout: { sessions: { listLineItems: async () => LINE_ITEMS } } };
  const res = await sendPurchase(session(), { env: ENV, lineItems: { data: [] }, stripe, fetchImpl: r.fetchImpl });
  assert.equal(res.sent, true);
  assert.equal(r.calls[0].body.events[0].params.items.length, 2);
});

/* ── brand guard ───────────────────────────────────────────────────────── */

test("brand guard: Labrats sessions pass, other brands' sessions are ignored", () => {
  assert.equal(isLabratsSession({ metadata: { brand: 'labrats', source: 'labrats-web' } }), true);
  assert.equal(isLabratsSession({ metadata: { source: 'labrats-web' } }), true); // legacy, before brand was stamped
  assert.equal(isLabratsSession({ metadata: { brand: 'labrats' } }), true);
  for (const metadata of [{ brand: 'catsoncrack' }, { brand: 'fuglys', source: 'fuglys-web' }, { brand: 'bikerbabies' }, {}, undefined]) {
    assert.equal(isLabratsSession({ metadata }), false, JSON.stringify(metadata));
  }
  assert.equal(isLabratsSession(null), false);
});

test('webhook: another brand\'s session gets 200 and nothing else happens', async () => {
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = async () => { fetched++; return { ok: true, json: async () => ({}) }; };
  const stripeStub = require.cache[require.resolve('stripe')];
  const webhookPath = require.resolve('../netlify/functions/stripe-webhook.cjs');
  delete require.cache[webhookPath];
  stripeStub.exports = () => ({
    webhooks: { constructEvent: () => ({ type: 'checkout.session.completed', data: { object: session({ metadata: { brand: 'fuglys', ga_client_id: '1.2' } }) } }) },
    checkout: { sessions: { listLineItems: async () => { throw new Error('must not be called'); } } },
  });
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  Object.assign(process.env, ENV);
  try {
    const { handler } = require(webhookPath);
    const res = await handler({ httpMethod: 'POST', body: '{}', headers: { 'stripe-signature': 'x' } });
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).skipped, 'other-brand');
    assert.equal(fetched, 0); // no email, Printful, Sanity or GA call
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.GA4_MEASUREMENT_ID;
    delete process.env.GA4_API_SECRET;
  }
});

/* ── checkout metadata ─────────────────────────────────────────────────── */

test('checkout keeps only valid GA ids, session id only with a client id', () => {
  assert.deepEqual(gaMetadata({ client_id: '123.456', session_id: '789' }), { ga_client_id: '123.456', ga_session_id: '789' });
  assert.deepEqual(gaMetadata({ client_id: '123.456', session_id: 789 }), { ga_client_id: '123.456', ga_session_id: '789' });
  assert.deepEqual(gaMetadata({ client_id: '123.456', session_id: 'x1' }), { ga_client_id: '123.456' });
  assert.deepEqual(gaMetadata({ client_id: 'GA1.1.123.456', session_id: '789' }), {});
  assert.deepEqual(gaMetadata({ session_id: '789' }), {});
  assert.deepEqual(gaMetadata(undefined), {});
  assert.deepEqual(gaMetadata({ client_id: `${'1'.repeat(70)}.1` }), {});
});

/* ── item_variant (browser side, same format as the purchase) ─────────── */

test('item_variant: "<colour> / <size>" for clothing, "<format> / <size>" slugs for wall art', async () => {
  const { itemVariant, gaItem } = await import('../src/lib/analytics.ts');
  assert.equal(itemVariant({ colour: 'Black', size: 'M', productType: 'tshirt' }), 'Black / M');
  assert.equal(itemVariant({ colour: '', size: 'One Size', productType: 'pin' }), 'One Size');
  assert.equal(itemVariant({ productType: 'wallart', format: 'poster', size: 'medium', colour: '' }), 'poster / medium');
  assert.equal(itemVariant({ productType: 'wallart', format: 'canvas-gallery', size: 'large' }), 'canvas-gallery / large');
  assert.equal(gaItem({ slug: 'labrats-frankenstein', name: 'Frankenstein', price: 46.99, productType: 'wallart', format: 'canvas-gallery', size: 'large', quantity: 1 }).item_variant, 'canvas-gallery / large');
});
