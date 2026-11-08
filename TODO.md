# Hiplastics update outcomes

## Urgent order lifecycle and payment safety
- [x] A scheduled endpoint rejects requests without the configured `CRON_SECRET` and expires unpaid ToyyibPay orders older than three days.
- [x] Expiry restores each order’s reserved stock and releases its coupon exactly once.
- [x] ToyyibPay callbacks and bill sync verify the paid amount against the stored order total.
- [x] A payment arriving after cancellation never silently changes the order back to a normal paid flow; it remains cancelled and alerts the admin.
- [x] Customer order links do not place the access token in payment return URLs; legacy token lookup remains backwards-compatible.

## Security and privacy
- [x] Approved public reviews never expose raw customer email through browser Supabase queries or server responses.
- [x] Coupon validation, order lookup, stock-notify requests, and admin login have bounded abuse protection.
- [x] Security headers include CSP-compatible baseline protections, frame protection, HSTS, and Referrer-Policy.

## Checkout and operations
- [x] Checkout validates Malaysian five-digit postcodes and Malaysian phone numbers and requires explicit terms/refund consent.
- [x] Invalid order-status transitions are rejected and permitted admin mutations are auditable.
- [x] Admin order loading supports pagination rather than a hard 300-row ceiling.
- [x] Contact defaults consistently use the Malaysia number, `sales@hiplastics.my`, and a Malaysia address.

## SEO, performance, analytics, and localization
- [x] HTML language/canonical/OG metadata reflects the current language and page baseline.
- [x] Product structured data includes tier-aware offers and review aggregate data when available.
- [x] Sitemap entries include `lastmod`; route manifest is served at `/manus-routes.json`.
- [x] GA4/Meta events cover add-to-cart, begin-checkout, purchase, and WhatsApp clicks after consent.
- [x] BM has crawlable `/ms/...` route aliases in addition to the existing toggle.
- [x] Vercel uses the Bun lockfile/toolchain and the public-data fallback no longer contains stale China contact data.

## B2B growth foundations
- [x] Inquiry/RFQ submissions persist as leads while retaining the WhatsApp handoff, and admins can update lead status and export CSV.
- [x] Expired/failed online orders expose a safe “Pay again” path and the cart shows configured free-shipping progress; coupon guardrails remain open for a later UX pass.
- [x] Product catalogue supports category, stock, price/name sorting, pagination, up-to-three-product comparison, and client-generated datasheet downloads.
- [ ] Account and admin foundations exist for saved addresses, low-stock and activity visibility; order export and packing-slip printing are available.


## Visitor and account-lead analytics

- [x] The admin sidebar includes a **Visitors & Leads** option under Sales.
- [x] The panel shows Malaysia-time today’s unique visitors, page views, signed-in visitors, and popular paths.
- [x] The panel lists registered Supabase Auth accounts that have no matching order by user ID or email, including name, email, registration date, and last sign-in date.
- [x] Visitor tracking stores one anonymous daily aggregate per browser ID and never exposes raw visitor data publicly.
- [ ] The additive Supabase analytics migration is applied to the connected project and the admin panel reports live values after refresh.
