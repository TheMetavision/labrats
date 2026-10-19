# Labrats: merch run-book

What was changed in the shop, why, and how to repeat or undo it. Newest work at the bottom of each section.
Tooling lives in `C:\Users\chris\Projects\printful-sync` (its own git repo); the site's code is on branches here.

## Stores and IDs

| | |
|---|---|
| Printful store | `PRINTFUL_STORE_LABRATS` (store-scoped token `PRINTFUL_TOKEN_LABRATS` in printful-sync `.env`; `PRINTFUL_API_KEY` on Netlify) |
| Sanity | project `o9qrmykx`, dataset `production` |
| Netlify site | `labratsuk`, id `756c6770-332f-4049-9b73-c61c0f0aa044` |
| Stripe | shared with Cats On Crack, The Fuglys and The Biker Babies (one account); sessions carry `metadata.brand = labrats` |

---

## Part A: margin audit (18 Oct 2026)

**Finding.** Every drinkware product lost money on GB orders. Live Printful quotes (`POST /orders/estimate-costs`, single item),
our VAT on GB sales, Stripe 1.5% + 20p, the delivery charge collected. Same blanks and prices as the other three IP brands:

| Product | Printful # | Stocked | Retail | GB landed | GB profit |
|---|---|---|---|---|---|
| 20oz Tumbler | 909 | US only | £22.50 | £36.41 | −£6.44 (−26%) |
| 16oz Can Glass | 690 | US only | £11.50 | £24.17 | −£5.24 (−34%) |
| Can Glass lid & straw | 690 | US only | £12.50 | £25.07 | −£5.17 (−32%) |
| Pin badge set (5) | 660 | US only | £9.95 | £18.41 | −£1.71 (−12%) |

Everything else makes 28–58% on a GB order (kids' and baby clothing more: it is zero-rated, which the audit's 20% VAT
model understated). Order history: 0 Printful orders and 1 Sanity order, an in-house poster test order
(SXW5M6TK, 21 Jul 2026). No customer had bought drinkware or pins, so actual losses were £0.

**Decisions (Alan, 18 Oct 2026):** tumbler moves to #585 (EU-stocked) at £32.95, white; can glass dropped; 11oz mug #19
(UK/EU) added at £12.95 with the design on both sides; pin badge sets dropped; delivery tied to destination.

### A1. Cross-brand orders (shared Stripe account)

Labrats had no incident of its own. The history that applies: before the brand guard (21 Jul 2026), every brand's
`stripe-webhook` processed every session on the shared Stripe account, so a Cats On Crack, Fuglys or Biker Babies order could
be logged (and tried at Printful) by the wrong brand. On 19 Jul this repo also had a stale `stripe-webhook.mjs` beside the
real one (removed with the brand guard, `3a2eaa3`). Fixed on 21 Jul. Added now, as a second lock: the own-store check.

### Own-store check in the webhook (branch `feat/margin-delivery`)

Before placing a Printful order, `stripe-webhook.cjs` asks `GET /store/variants/{id}` for every line with the store-scoped
`PRINTFUL_API_KEY`: 200 only for this store's variants, 404 for another store's. If any line isn't ours, or the check fails,
**nothing is ordered**: the merchant alert says NOT OUR VARIANT with the ids, and the order log gets
`status: fulfilment-failed` and the reason in `failureReason`. Tests: `tests/own-store-check.test.mjs`.

**Confirm or draft.** The Printful order is created with an explicit `?confirm=`: `true` only when `PRINTFUL_AUTO_CONFIRM`
is exactly `true` (set in the production context only, 18 Oct) AND the payment is live. Every Stripe test-mode payment is a
Printful **draft**, logged with `test: true` and alerted as `[TEST]`. Order schema: `other-brand` status and the `test` flag.

### A2. Delivery tied to the destination (branch `feat/margin-delivery`)

Before: all five delivery rates were offered to every buyer, so an overseas buyer could pick UK Standard (£6.95).

- `src/lib/shipping-regions.mjs`: regions and rates (unchanged: UK £6.95, free from £75; Europe £9.95; USA/Canada £10.95;
  Australia/NZ/Japan/Brazil £11.95; Rest of World £14.95) and the same 76 countries. Identical in all four IP sites.
- Cart drawer: "Delivering to" country picker (remembered on the device as `labrats-delivery-country`, guessed from the
  browser language), the delivery line and total for that country, the free-UK bar only for GB, and a warning for lines
  Printful won't ship there (checkout disabled until they're removed).
- `create-checkout.cjs`: requires the country; refuses unknown ones (400) and lines Printful won't ship there (422);
  Stripe gets `allowed_countries: [country]` and only that region's rate; `metadata.delivery_country`.
- `src/data/ship-to.json`: countries refused per productType, generated from Printful's own answers. Regenerate after any
  range change:
  ```powershell
  cd C:\Users\chris\Projects\printful-sync
  node --env-file=.env probe-ship-to.mjs catsoncrack labrats thefuglys bikerbabies --extra=585,19   # ~25 min, quotes only
  node export-ship-to.mjs labrats C:\Users\chris\Projects\labrats\src\data\ship-to.json
  ```
- What the probe found (18 Oct): **Brazil** fails for every Printful product (Printful needs the recipient's CPF/CNPJ and
  the checkout doesn't collect it), so Printful lines are refused for BR; wall art (in-house) still ships there.
  **Ukraine** is refused for adult apparel, kids long sleeves and baby grows (kids tees and hoodies, socks, stickers,
  #585 and the mug ship there).
- Merch tabs: Mugs added after Tumblers; Can Glasses and Badges kept while those products exist (empty tabs vanish).
  Size guide: the mug replaces the can glass.
- Tests: `tests/delivery-destination.test.mjs`, including old and new catalogue lines checking out together.

### Previews: test payments and draft catalogue

- **Stripe TEST values** in `deploy-preview` and `branch-deploy` only, so preview checkouts are test payments. Production
  keeps the live values. Set with `scripts\set-stripe-test.ps1` (refuses anything but `rk_test_`/`sk_test_` and
  `whsec_`, delete-then-recreate as secrets, stops if production's value ids change). Needs a TEST-mode webhook endpoint
  in Stripe for the preview URL, event `checkout.session.completed`.
  Production value ids before (18 Oct): `STRIPE_SECRET_KEY` `2e63cb8e`, `STRIPE_WEBHOOK_SECRET` `c2c30b7d`.
- **Draft catalogue on previews:** `SANITY_PERSPECTIVE=previewDrafts` is set in `deploy-preview` and `branch-deploy` only
  (18 Oct), so a preview build and its checkout read Sanity drafts (both contexts have `SANITY_API_TOKEN`); production
  reads published.
- **Production:** `PRINTFUL_AUTO_CONFIRM=true` set in the production context only (18 Oct). The current production code
  doesn't read it; from the merge, live orders are confirmed at Printful automatically instead of arriving as drafts.

### A3. Pin badge sets (#660)

Printful has no UK/EU badge blank (#660 is its only one, US-stocked). 30% on GB would need £20.50 for a set of five, against
£5–£10 in the market. Dropped: see part B for the Sanity docs and Printful products.

---

## Part B: drinkware

Config: `printful-sync/brands/labrats.config.mjs`.

| Garment | Blank | Price | Notes |
|---|---|---|---|
| `tumbler` | #585 Stainless Steel Tumbler 20 oz, White (EU) | £32.95 | `externalKey: tumbler585` (new products sit beside #909's until those go). Printed on both sides, as Dotty's: the design twice, at ¼ and ¾ of the 2776×2374 wrap, each in a 1250×1450 box (`make-mug-wraps.mjs --kind=tumbler` → `designs.tumblerPrintFileUrl`); images: Left, "Printed on both sides", Right |
| `mug` | #19 White Glossy Mug 11 oz (UK + EU) | £12.95 | design twice, at ¼ and ¾ of the 2700×1050 wrap (`make-mug-wraps.mjs` → `designs.mugPrintFileUrl`); images: Front, "Printed on both sides", Handle on Left |
| `glass` | #690 | — | removed from the config |

Steps done (18–19 Oct 2026, printful-sync):

1. Mockup check before creating anything (`mockup-check.mjs`, Mockup Generator, no products): the two-sided tumbler (Left and
   Right) and the mug (Front and Handle on Left) on boomer-blazeclaw-boom. Images: `printful-sync/mockup-checks/labrats/`.
2. Wraps for all 28 designs uploaded to the Sanity CDN: `make-mug-wraps.mjs labrats --kind=mug` and `--kind=tumbler`.
3. Printful products created in batches of 6 (`run-batches.ps1 -Brand labrats -Stage printful -Flags "--types=tumbler,mug"`,
   waiting whenever printful-sync was busy): one #585 tumbler and one mug per design, 56 products.
   `store-check.mjs labrats tumbler585,mug`: every design has one of each, no duplicate external ids.
4. Pin sets: drafts with `active: false` (`draft-inactive.mjs`) for the 4 pin sets (`product-badge-set-1` … `-4`; Printful 437528876, 437528915, 437528996, 437529034). No unfinished Printful orders.
5. Mockups for the new garments only, in small resumable runs (`next-mockups.ps1 -Brand labrats -Count 3`, memory checked
   between runs): every tumbler has Left, "Printed on both sides" and Right; every mug Front, "Printed on both sides" and
   Handle on Left (Mockup Generator, re-hosted on the Sanity CDN).
6. Sanity **drafts** (`run-batches.ps1 -Brand labrats -Stage sync -Flags "--types=tumbler,mug --drop-types=glass"`): on all 28 designs
   the tumbler is replaced by #585 (£32.95, White), the mug added (£12.95), the can glass removed; every other garment, all
   copy and images exactly as published. `verify-drafts.mjs labrats tumbler,mug glass`: no problems, every variant id in the
   live store. Production still shows the published (old) catalogue; the deploy preview reads the drafts.
7. Size guide: tumbler 20 oz / 600 ml, 8.4″ (21.4 cm); mug 11 oz, 3.8″ (9.6 cm), from Printful's catalogue for #585 and #19.
8. Preview: https://deploy-preview-6--labratsuk.netlify.app. The checkout function refuses no country (400), an unknown one (400), a Printful item to Brazil
   or a tee to Ukraine (422), all before Stripe.

### Launch order, after Alan approves the preview (in this order, nothing earlier)

1. **Merge the PR** (`feat/margin-delivery`, Alan). Netlify rebuilds production from `main`: the new code against the old,
   published catalogue. It handles both: can glasses and badges still list and check out until their products go (tabs
   kept, empty tabs vanish; test "old and new catalogue both check out"), and a basket with no country set just shows the
   picker.
2. **Deploy the Studio schema** from `sanity/`: `npx sanity schema deploy` and `npx sanity deploy` (`other-brand` status,
   `test` flag).
3. **Publish the drafts**: `cd C:\Users\chris\Projects\printful-sync`, `node --env-file=.env publish-drafts.mjs labrats --dry`,
   then without `--dry`. Production then needs a rebuild to show them (Netlify: trigger deploy, or the next push to `main`).
4. **Check the live site**: a tumbler and a mug page (both-sides images), the basket country picker, a GB basket reaching
   Stripe with one rate and one country, merch tabs without Can Glasses or Badges.
5. **Only then delete the old products**, after `pins-report.mjs labrats` shows no unfinished Printful orders: the #909
   tumblers (`labrats-<slug>-tumbler`), the #690 can glasses (`-glass`) and the pin sets. The `product-badge-set-*` docs
   stay in Sanity, inactive.
6. `store-check.mjs labrats tumbler585,mug,tumbler,glass,pin` should then show 0 for tumbler, glass and pin.
7. Production env: `PRINTFUL_AUTO_CONFIRM=true` (production context only) makes live orders confirmed; without it they are
   Printful drafts to confirm by hand. Previews never confirm (test-mode payments are always drafts).

### Launch record (19 Oct 2026, Alan's approval; after Cats On Crack)

1. **Merged** PR #6 (`85baa1f`); Netlify production deploy of it ready.
2. **Studio schema deployed** from a clean worktree of `main`: `npx sanity schema deploy` and
   `npx sanity deploy` → https://labrats.sanity.studio/. The deployed `order` type has the `other-brand` status and the `test` flag
   (checked through the Sanity MCP).
3. **Drafts published** (`publish-drafts.mjs labrats`): 32 (28 designs, 4 inactive pin sets), after `verify-drafts.mjs` showed no problems.
   Published: 28 with the #585 tumbler (£32.95, White) and the mug (£12.95), 0 with a can glass, 0 active pin sets.
4. **Production rebuilt** (Netlify build of `main`) and checked live, all passing: merch shows Mugs and no Can Glasses or
   Badges tab; /products/boomer-blazeclaw-boom/ has £32.95 and £12.95 and no £22.50 or can glass; badge set pages 404, stickers live; size
   guide shows 8.4″ (21.4 cm) and 3.8″ (9.6 cm); checkout refuses no country (400), an unknown country (400), Brazil (422).
   No live Stripe Checkout page was opened.
5. **Old products deleted** (`delete-old-products.mjs labrats`, dry run then `--apply`; exact external ids, each checked
   to be on #909 / #690 / #660; no unfinished Printful orders): 28 #909 tumblers, 28 #690 can glasses, 4 pin sets (437528876, 437528915, 437528996, 437529034). Store 372 → 312 products. `store-check.mjs`:
   0 #909 tumblers, 0 can glasses; 28 tumbler585, 28 mug. `check-live-ids.mjs labrats`: all 11,848 variant ids on
   the 30 active products are live.
6. The `product-badge-set-*` docs stay in Sanity, inactive.

### After every preview test payment

Test-mode orders reach Printful as **drafts** (never confirmed) and the Sanity log as `test: true`. Delete them after each test:
`cd C:\Users\chris\Projects\printful-sync`, `node --env-file=.env delete-test-orders.mjs labrats` (lists them), then
`... --apply` (deletes the Printful drafts and the test log records).
