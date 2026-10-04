/**
 * src/lib/ga4-purchase.cjs  (Labrats — server-side GA4 purchase)
 *
 * Called by netlify/functions/stripe-webhook.cjs after the brand guard and
 * after the order / Printful handling and the Sanity order save. Sends one
 * Measurement Protocol `purchase` for a paid Checkout Session, using the
 * ga_client_id / ga_session_id that create-checkout stored in the session
 * metadata (present only when the shopper accepted analytics).
 *
 *   transaction_id  Stripe session id
 *   value           what Stripe charged, excluding shipping
 *   shipping, tax   their own fields
 *   items           item_variant "<colour> / <size>" or, for wall art,
 *                   "<format-slug> / <size-slug>" (Cats On Crack format);
 *                   price actually charged per unit after discounts; each
 *                   line's discount share (per unit) in `discount`
 *   consent         ads signals denied
 *
 * Skips silently without GA4_MEASUREMENT_ID / GA4_API_SECRET, without a valid
 * ga_client_id, or for a test-mode session. One overall timeout (~2.5 s)
 * covers the "already recorded?" check, any Stripe lookup and the GA call.
 * Never throws: always resolves to { sent, reason }.
 */

const MP_URL = 'https://www.google-analytics.com/mp/collect';
const TIMEOUT_MS = 2500;
const CLIENT_ID_RE = /^\d+\.\d+$/;
const SESSION_ID_RE = /^\d{1,20}$/;

const round2 = (n) => Math.round(n * 100) / 100;
const pounds = (minor) => round2((Number(minor) || 0) / 100);

/** Why this session must not be sent, or null if it may be. */
function purchaseSkipReason(session, env = process.env) {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) return 'not-configured';
  const clientId = session && session.metadata && session.metadata.ga_client_id;
  if (!clientId || !CLIENT_ID_RE.test(String(clientId))) return 'no-client-id';
  if (!session.livemode) return 'test-mode';
  return null;
}

function productMeta(li, key) {
  const p = li.price && li.price.product;
  return p && typeof p === 'object' && p.metadata ? p.metadata[key] : undefined;
}

function purchaseItem(li) {
  const quantity = li.quantity || 1;
  const inhouse = productMeta(li, 'fulfilment') === 'inhouse';
  const variant = inhouse
    ? [productMeta(li, 'wallart_format'), productMeta(li, 'wallart_size')].filter(Boolean).join(' / ')
    : [productMeta(li, 'labrats_colour'), productMeta(li, 'labrats_size')].filter(Boolean).join(' / ');
  const product = li.price && li.price.product;
  const item = {
    item_id: productMeta(li, 'slug') || productMeta(li, 'wallart_slug')
      || (product && typeof product === 'object' ? product.id : product) || li.id || '',
    item_name: li.description || '',
    item_category: productMeta(li, 'product_type') || (inhouse ? 'wallart' : ''),
    // amount_total is after discounts (and includes any tax), per line.
    price: round2(pounds(li.amount_total) / quantity),
    quantity,
  };
  if (variant) item.item_variant = variant;
  const discount = round2(pounds(li.amount_discount) / quantity);
  if (discount > 0) item.discount = discount;
  return item;
}

/** The Measurement Protocol body for a session and its listed line items. */
function buildPurchasePayload(session, lineItems) {
  const shippingMinor = session.shipping_cost
    ? session.shipping_cost.amount_total
    : (session.total_details && session.total_details.amount_shipping) || 0;
  const taxMinor = (session.total_details && session.total_details.amount_tax) || 0;
  const params = {
    transaction_id: session.id,
    currency: String(session.currency || 'gbp').toUpperCase(),
    value: round2(pounds(session.amount_total) - pounds(shippingMinor)),
    shipping: pounds(shippingMinor),
    tax: pounds(taxMinor),
    items: ((lineItems && lineItems.data) || []).map(purchaseItem),
    engagement_time_msec: 1,
  };
  const sessionId = session.metadata && session.metadata.ga_session_id;
  if (sessionId && SESSION_ID_RE.test(String(sessionId))) params.session_id = String(sessionId);
  return {
    client_id: String(session.metadata.ga_client_id),
    consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
    events: [{ name: 'purchase', params }],
  };
}

/**
 * Send the purchase. Options:
 *   lineItems        the webhook's listLineItems result (expanded products);
 *                    listed here via `stripe` when missing or empty
 *   stripe           Stripe client, for that lookup
 *   alreadyRecorded  () => boolean | Promise<boolean>; true skips (Stripe retry)
 *   env, fetchImpl, timeoutMs   for tests
 */
async function sendPurchase(session, opts = {}) {
  try {
    const env = opts.env || process.env;
    const skip = purchaseSkipReason(session, env);
    if (skip) return { sent: false, reason: skip };

    const fetchImpl = opts.fetchImpl || fetch;
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((resolve) => {
      timer = setTimeout(() => { controller.abort(); resolve({ sent: false, reason: 'timeout' }); }, opts.timeoutMs || TIMEOUT_MS);
    });

    const work = (async () => {
      if (opts.alreadyRecorded && await opts.alreadyRecorded()) return { sent: false, reason: 'already-recorded' };
      let lineItems = opts.lineItems;
      if ((!lineItems || !lineItems.data || !lineItems.data.length) && opts.stripe) {
        lineItems = await opts.stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ['data.price.product'] });
      }
      const payload = buildPurchasePayload(session, lineItems);
      const url = `${MP_URL}?measurement_id=${encodeURIComponent(env.GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(env.GA4_API_SECRET)}`;
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return res && res.ok ? { sent: true, reason: 'ok' } : { sent: false, reason: `http-${res && res.status}` };
    })().catch((err) => ({ sent: false, reason: `error: ${(err && err.message) || err}` }));

    const result = await Promise.race([work, deadline]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    return { sent: false, reason: `error: ${(err && err.message) || err}` };
  }
}

module.exports = { sendPurchase, buildPurchasePayload, purchaseSkipReason, TIMEOUT_MS };
