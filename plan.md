# Hiplastics website update plan

## Scope
Implement the pasted audit as a staged hardening and conversion update. Preserve the existing Hiplastics visual language and Supabase/Vercel architecture; do not create a replacement site.

## Phase 1 — urgent reliability and security
- Add a protected Vercel cron that expires unpaid ToyyibPay orders after three days, restores reserved stock, releases coupons, and records the cancellation idempotently.
- Verify ToyyibPay payment amount against the order total; if a cancelled order later becomes paid, keep the cancelled status and send an admin alert instead of silently treating it as normal.
- Remove tokenized order URLs from payment return links and add Referrer-Policy/security headers; keep token support only as a backwards-compatible read path.
- Require `CRON_SECRET`; add rate-limit protection for coupon checks, order lookup, back-in-stock requests, and admin login at the application boundary.
- Close the public review email exposure in SQL and keep public review responses masked/server-shaped.

## Phase 2 — checkout, admin, data quality, and performance
- Enforce Malaysian postcode/phone validation and terms/refund consent at checkout.
- Validate order status transitions and add order audit records; paginate admin order queries.
- Normalize Malaysia contact defaults and all email/WhatsApp links to the `.my` domain and configured Malaysia number.
- Use Bun in Vercel install/build, add image loading/decoding hints, cache public data briefly, and avoid loading full news bodies for listing pages where possible.

## Phase 3 — SEO and measurement
- Make language metadata reflect the selected language, add canonical/OG image/hreflang metadata, aggregate product ratings and tier-aware offer data, and add sitemap `lastmod`.
- Add consent-gated GA4/Meta events for add-to-cart, begin-checkout, purchase, and WhatsApp clicks.
- Add `public/manus-routes.json` and keep it synchronized with the route set.

## Phase 4 — B2B growth foundations
- Add database-backed inquiry/RFQ records and an admin-visible quote lead flow while preserving the WhatsApp CTA.
- Add expired-order Pay again behavior, free-shipping progress messaging, coupon-per-customer/first-order rules, and product filters/pagination/compare/datasheet links.
- Add account saved addresses, wishlist/cart sync, shipping/tracking helpers, and admin search/filter/export/packing-slip/activity foundations.
- Add crawlable `/ms/...` route aliases with hreflang while retaining the current in-app BM toggle.

## Design

Three candidate styles: **Industrial blue utility** (0.06); **Warm Malaysian procurement editorial** (0.07); **Quiet technical catalogue** (0.05). Choose **Industrial blue utility**, reusing the existing Hiplastics blue, white surfaces, compact catalogue cards, and strong procurement CTAs.

- **Design Movement:** modern industrial catalogue / Swiss utility.
- **Core Principles:** clear hierarchy, operational trust, fast scanning, and restrained decoration.
- **Color Philosophy:** blue signals dependable supply and action; white and pale cool surfaces keep product imagery legible; amber/red are reserved for stock and payment states.
- **Layout Paradigm:** left-anchored editorial sections with asymmetric proof blocks rather than a generic centered marketing grid.
- **Signature Elements:** blue rule labels, compact spec chips, and persistent but unobtrusive contact actions.
- **Interaction Philosophy:** every interaction should shorten procurement time; errors explain the next operational step.
- **Animation:** subtle opacity/translate transitions only; no motion that delays checkout or hides stock state.
- **Typography System:** Inter for UI and body; bold compact headings with generous line-height for catalogue scanning.
- **Brand Essence:** Malaysia-ready retail display supply for procurement teams who need dependable stock, compatibility, and fast support. Personality: practical, credible, responsive.
- **Brand Voice:** direct and operational. Example lines: “Share quantities and store count—we’ll quote within 24 hours.” “Malaysia stock, clear compatibility, no guesswork.”
- **Wordmark & Logo:** retain the existing Hiplastics wordmark asset; use the compact blue mark in header/footer and a durable HTTPS logo URL for platform metadata.
- **Signature Brand Color:** Hiplastics blue `#1f4fd1`.

## Project structure
- `src/lib/shop.server.ts`: pricing, order lifecycle, payment verification, expiry and audit behavior.
- `src/lib/shop.functions.ts`: validated server-function boundaries and rate-limit hooks.
- `src/routes/api/public/*`: cron/payment endpoints.
- `src/components` and `src/routes/cart.tsx`: customer-facing checkout and conversion UI.
- `src/lib/site.ts`, `src/lib/i18n.tsx`, route heads and `sitemap.xml`: canonical contact, language and SEO behavior.
- `supabase-setup.sql`: additive/idempotent schema and RLS migrations.
- `vercel.json`, `public/robots.txt`, `public/manus-routes.json`: deployment, security and route metadata.
