/**
 * src/lib/analytics.ts  (Labrats — GA4, consent-gated)
 *
 * Same model as Cats On Crack / Wyrmfuel / Pixel8 / Comic Strip Canvas:
 *  - Nothing Google-related loads until the visitor accepts (UK PECR). The
 *    gtag.js URL lives only in this bundled module, never in page HTML.
 *  - The choice is kept in localStorage 'labrats-consent' ("granted" | "denied").
 *  - Accept → consent default (analytics granted, every ads signal denied),
 *    load gtag.js, config (sends page_view).
 *  - Reject after an accept → ga-disable flag + delete the _ga cookies, so
 *    nothing more is sent from the current page.
 *  - On /order-success the query string (Stripe session id) is stripped from
 *    page_location and the referrer is cut to its origin.
 *
 * Shop events (view_item, add_to_cart, begin_checkout) are no-ops without
 * consent. prepareCheckout() also collects client_id / session_id for the
 * server-side Measurement Protocol purchase (see src/lib/ga4-purchase.cjs).
 *
 * No window access at module top level: cart.ts imports this and is rendered
 * on the server too.
 */
// @ts-ignore — shared CommonJS pricing module (no .d.ts; resolved by Vite at build)
import { isWallArt } from './artwork-pricing.mjs';

export const GA_ID = 'G-XSQX10PWDY';
export const CONSENT_KEY = 'labrats-consent';
export const CURRENCY = 'GBP'; // create-checkout charges in gbp
/** begin_checkout + the GA id lookup share this one limit before the Stripe redirect. */
export const CHECKOUT_WAIT_MS = 800;

type Consent = 'granted' | 'denied';
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    __labratsViewItem?: ViewItemDetail;
  }
}

/** One GA4 item. */
export interface GaItem {
  item_id: string;
  item_name: string;
  item_variant?: string;
  item_category?: string;
  price: number;
  quantity: number;
}

/** Shape of a cart line as far as analytics cares (CartItem satisfies it). */
export interface GaLine {
  slug?: string;
  name: string;
  price: number;
  size?: string;
  colour?: string;
  format?: string;
  productType?: string;
  quantity: number;
}

/** What the PDP inline scripts put on the 'labrats-view-item' event. */
export type ViewItemDetail = GaItem;

export interface GaIds { client_id?: string; session_id?: string }

const CLIENT_ID_RE = /^\d+\.\d+$/;
const SESSION_ID_RE = /^\d{1,20}$/;

/* ── consent storage ─────────────────────────────────────────────────── */

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

function storeConsent(v: Consent) {
  try { localStorage.setItem(CONSENT_KEY, v); } catch { /* private mode: applies to this page only */ }
}

/* ── tag loading ─────────────────────────────────────────────────────── */

let loaded = false;
const disableKey = `ga-disable-${GA_ID}`;

function isOrderConfirmation() {
  return /^\/order-success\/?$/.test(location.pathname);
}

function gtag(...args: unknown[]) {
  if (window.gtag) window.gtag(...args);
}

function loadGa() {
  (window as any)[disableKey] = false;
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    // gtag.js expects the Arguments object, not an array.
    window.gtag = function () { window.dataLayer!.push(arguments); } as Gtag;
  }
  if (!loaded) {
    loaded = true;
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    gtag('js', new Date());
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }
  const config: Record<string, unknown> = {};
  if (isOrderConfirmation()) {
    // Never let the Stripe session id (or anything else in the URL) reach Google.
    config.page_location = location.origin + location.pathname;
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).origin + '/' : ''; } catch { /* bad referrer */ }
    config.page_referrer = ref;
  }
  gtag('config', GA_ID, config);
}

/** Expire every _ga / _ga_<container> cookie on this host and its parent domains. */
function deleteGaCookies() {
  const names = document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga(_|$)/.test(n));
  const parts = location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i++) {
    const d = parts.slice(i).join('.');
    domains.push(`; domain=${d}`, `; domain=.${d}`);
  }
  for (const name of names) {
    for (const d of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
    }
  }
}

function disableGa() {
  (window as any)[disableKey] = true;
  deleteGaCookies();
}

function analyticsOn() {
  return typeof window !== 'undefined' && getConsent() === 'granted' && loaded && !(window as any)[disableKey];
}

/** Record the visitor's choice and act on it now. */
export function setConsent(v: Consent) {
  storeConsent(v);
  if (v === 'granted') loadGa();
  else disableGa();
}

/* ── shop events ─────────────────────────────────────────────────────── */

/** GA4 item_variant, in the Cats On Crack format: "<colour> / <size>"
    (e.g. "Black / M"), or "<format-slug> / <size-slug>" for wall art
    (e.g. "canvas-gallery / large"). */
export function itemVariant(line: Pick<GaLine, 'size' | 'colour' | 'format' | 'productType'>): string {
  return isWallArt(line)
    ? [line.format, line.size].filter(Boolean).join(' / ')
    : [line.colour, line.size].filter(Boolean).join(' / ');
}

/** GA4 item for a cart line. item_id is the product slug. */
export function gaItem(line: GaLine, quantity = line.quantity): GaItem {
  const art = isWallArt(line);
  const variant = itemVariant(line);
  return {
    item_id: line.slug || '',
    item_name: line.name,
    item_variant: variant,
    item_category: art ? 'wallart' : (line.productType || ''),
    price: Number(line.price) || 0,
    quantity,
  };
}

const value = (items: GaItem[]) => Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

export function trackViewItem(item: GaItem) {
  if (!analyticsOn()) return;
  gtag('event', 'view_item', { currency: CURRENCY, value: value([item]), items: [item] });
}

export function trackAddToCart(line: GaLine, quantity = 1) {
  if (!analyticsOn()) return;
  const item = gaItem(line, quantity);
  gtag('event', 'add_to_cart', { currency: CURRENCY, value: value([item]), items: [item] });
}

/**
 * Before the Stripe redirect: send begin_checkout and read client_id /
 * session_id, all inside one CHECKOUT_WAIT_MS limit. Resolves with whatever
 * ids answered in time (validated; session_id only with a client_id), or {}
 * without consent. Never rejects.
 */
export function prepareCheckout(lines: GaLine[]): Promise<GaIds> {
  if (!analyticsOn() || !lines.length) return Promise.resolve({});
  const found: GaIds = {};
  const items = lines.map((l) => gaItem(l));
  const tasks = [
    new Promise<void>((done) => gtag('event', 'begin_checkout', {
      currency: CURRENCY, value: value(items), items,
      event_callback: () => done(), event_timeout: CHECKOUT_WAIT_MS,
    })),
    new Promise<void>((done) => gtag('get', GA_ID, 'client_id', (v: unknown) => {
      if (CLIENT_ID_RE.test(String(v ?? ''))) found.client_id = String(v);
      done();
    })),
    new Promise<void>((done) => gtag('get', GA_ID, 'session_id', (v: unknown) => {
      if (SESSION_ID_RE.test(String(v ?? ''))) found.session_id = String(v);
      done();
    })),
  ];
  const limit = new Promise<void>((done) => setTimeout(done, CHECKOUT_WAIT_MS));
  return Promise.race([Promise.all(tasks), limit]).then(() => {
    if (!found.client_id) return {};
    return found.session_id ? { client_id: found.client_id, session_id: found.session_id } : { client_id: found.client_id };
  }, () => ({}));
}

/* ── banner wiring (called once per page by ConsentBanner.astro) ─────── */

export function initConsent() {
  // No banner and no GA on admin / studio pages (none exist on this site today).
  if (/^\/(admin|studio)(\/|$)/.test(location.pathname)) return;

  const banner = document.getElementById('consent-banner');
  // --consent-h lets fixed bottom-corner UI (the audio log) sit above the banner.
  const syncHeight = () => document.documentElement.style.setProperty(
    '--consent-h', banner && !banner.hidden ? `${banner.offsetHeight}px` : '0px');
  const show = (focus = true) => {
    if (!banner) return;
    banner.hidden = false;
    syncHeight();
    if (focus) banner.querySelector<HTMLButtonElement>('[data-consent]')?.focus();
  };
  const hide = () => { if (banner) banner.hidden = true; syncHeight(); };
  window.addEventListener('resize', syncHeight);

  const choice = getConsent();
  if (choice === 'granted') loadGa();
  else if (choice === null) show(false);

  banner?.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.consent === 'granted' ? 'granted' : 'denied';
      // Re-accepting on a page that already loaded GA must not send a second page_view.
      if (v === 'granted' && getConsent() === 'granted' && loaded && !(window as any)[disableKey]) { hide(); return; }
      setConsent(v);
      hide();
    });
  });

  // Every "Cookie settings" link (footer, or the banner's fallback) reopens it.
  document.addEventListener('click', (e) => {
    const t = (e.target as Element | null)?.closest?.('[data-cookie-settings]');
    if (!t) return;
    e.preventDefault();
    show();
  });

  // Product pages announce the selected variant from inline scripts, which can
  // run before this module: pick up the latest one, then listen for changes.
  if (window.__labratsViewItem) trackViewItem(window.__labratsViewItem);
  window.addEventListener('labrats-view-item', (e) => trackViewItem((e as CustomEvent<ViewItemDetail>).detail));
}
