# Phase 2 evidence — Entrance design

Branch `phase/2-entrance-design`. Instructions: `docs/design/APPLY-ENTRANCE-DESIGN.md`. Every result below was observed in the session that recorded it.

## Preconditions (§0) — 6 November 2026

- **§0.1 Phase 0 merged into `master`: not met.** No PR existed for `phase/0-stabilise`, and `origin/master` (`340d8b2`) did not contain its 34 commits. Claude stopped and asked; the owner replied "Start right away".
- **§0.2 deviation, owner-approved:** instead of branching from `master`, `phase/2-entrance-design` was created from `phase/0-stabilise` (`5086417`), with `origin/master` merged in (`6b9ef60`: adds `docs/design/**`, no conflicts). Every path in the instructions assumes the Phase 0 layout (`app/(site)/…`), so stacking avoids the conflicts §0.1 warns about. When Phase 0 merges, this branch's PR targets `master` and contains only Phase 2 commits.
- **§0.3** read: `CLAUDE.md`, `AGENTS.md`, the brief (§1, §4 Phase 2, §7, §8), the audit, `OPEN_ITEMS.md`, `DECISIONS.md`, the instructions, all four `docs/design/entrance/*.dc.html` and their README.

## §0.4 Baseline (before any Phase 2 change)

Environment: Windows 10 Pro 10.0.19045, Node 24.15.0, pnpm 11.19.0, Docker 29.8.2. Branch at `6b9ef60`.

| Command | Result | Key output |
|---|---|---|
| `pnpm install --frozen-lockfile` | **pass** | |
| `pnpm typecheck` | **pass** | 5 projects |
| `pnpm lint` | **pass** | `4 problems (0 errors, 4 warnings)`, all `@next/next/no-img-element` (B6) |
| `pnpm test` | **pass** | `payment-paystack 56 passed`, `storefront 29 passed` |
| `pnpm tokens:check` | **pass** | `Contrast check passed for 7 label themes.` |
| `pnpm build` (with `.env`, `DATABASE_URL` overridden to the disposable `db:verify` Postgres on 5433) | **pass** | types, payment-paystack, storefront and medusa `Done`. The dev database on 5434 was deliberately not used: it is a dev-push database, and a build that reaches a database applies migrations (Phase 0, N9). Next 16.4.5 (Turbopack) no longer prints per-route "First Load JS" in the build output, so §7's JS budget needs another measurement. |
| `pnpm test:e2e` | **pass** | first run failed (`Executable doesn't exist … chrome-headless-shell`): Playwright's browser was not installed locally. `pnpm exec playwright install chromium` (Chrome Headless Shell 156.0.8078.4, 118 MiB, Playwright CDN), then `5 passed (1.4m)` |

## "Before" screenshots

`node scripts/screenshots.mjs http://127.0.0.1:3100 docs/evidence/phase-2/before 390,1440`: production standalone build (`NODE_ENV=production`) on port 3100 against the disposable Postgres, full page, `deviceScaleFactor: 1`, analytics prompt pre-answered "rejected". All 12 routes answered 200.

| Route | 390 px | 1440 px |
|---|---|---|
| `/` | `before/home-390.png` | `before/home-1440.png` |
| `/l/trybe` | `before/label-trybe-390.png` | `before/label-trybe-1440.png` |
| `/shop` | `before/shop-390.png` | `before/shop-1440.png` |
| `/p/<handle>` | `before/pdp-no-local-catalogue-390.png` | `before/pdp-no-local-catalogue-1440.png` |
| `/bag` | `before/bag-390.png` | `before/bag-1440.png` |
| `/checkout` | `before/checkout-390.png` | `before/checkout-1440.png` |

**Limitation:** no Medusa catalogue runs locally, so there is no real product handle. The PDP capture shows the not-found state, and `/shop` and `/l/trybe` show the "catalogue unavailable" state. The "before" homepage also shows customer-facing placeholder copy that Phase 2 must remove: the hard-coded hero ("One house. Seven labels." / crochet line), the Instagram "Featured pieces" section (rights unverified), and the footer line "Customer support details will be published here once confirmed."

## §5.5 PDP — 6 November 2026 (cloud session)

Environment: Linux cloud container, Node 22.23.4, pnpm 11.19.0. The session moved from the desktop app; the desktop's uncommitted change (`.claude/launch.json`, local launch presets only) was unstaged and is not committed. §2–§5.4 were committed in the desktop session; their checks are described in those commit messages and were **not** re-recorded here.

**Database:** Docker Hub returned `429 Too Many Requests` for `postgres:17-alpine`, so `pnpm db:verify:up` could not run. A throwaway local **PostgreSQL 16** cluster on 127.0.0.1:5433 (same `verify` credentials) was used instead and recreated before each production build: a `next dev` run schema-pushes the database, and a later production build then hangs prerendering `/dev/type`, `/dev/ui` and `/preview/homepage` (> 60 s × 3, build failed) because Payload's migration meets a dev-pushed schema. On a fresh database the build passes. Phase 0's PG 17 proof stands; PG 16 here is a local-only deviation.

**Catalogue:** no Medusa runs in this container. `e2e/support/mock-medusa.mjs` (new) serves a fictional Store API (16 test products, NGN test region, in-memory carts, `data:` SVG images because the CSP allows only `https:`/`data:` images). It is started by `playwright.config.ts` for e2e and was used for the screenshots below. None of its data is Lopaworld data.

### What changed
- **Layout:** gallery `flex: 999 1 560px`, buy panel `flex: 1 1 400px; max-width: 520px`, sticky under the header from 1024 px. `Breadcrumb` (Home / label / category or Shop / product); BreadcrumbList JSON-LD now includes the label and category.
- **Buy panel order:** label eyebrow link → title (`.lw-display`, 56 px) → `subtitle` (`.lw-voice`, 24 px) only if set → price (`aria-live`, "From …" until every option is chosen, no conversions) → colour via `ColourSwatch` (text pills without `swatch_hex`), legend "Colour — value" → size via `SizeSelector` with `lowStock` (1–3 left, stock-tracked only), legend shows "· last one" / "· N left", "Size guide (cm / in)" only when a size guide exists → made-to-order note + notes field (existing) → `QuantityStepper` → 56 px ink CTA: "Choose a size" / "Add to bag — size 44" / "Sold out" / "Adding…" → `--success-fill` status strip "Added to bag — <title>, <colour>, size N. View bag" → "Save for later" (`WishlistButton`, full width; WhatsApp cell waits for D5).
- **Size is never pre-selected** when a piece has more than one size (colour still is), so nobody adds a size by accident.
- **Hidden / removed:** RTW/MTM mode tabs (not rendered; `productHasMadeToMeasure` helper ready for Phase 3), delivery estimator (D4), payment-channel line, the placeholder Returns text (Returns shows only when a published Payload page `returns` exists, linking to `/pages/returns`), the WhatsApp paragraph (D5), "Product imagery is being prepared." (now a blank label-tone block), "Price unavailable".
- **Accordions:** Details, Fit, Fabric, Care, Delivery, each only if present.
- **Sticky phone bar:** ink, price left, CTA right, sits above the tab bar, hidden while the notes field has focus. With a size still open its button reads "Choose a size" and scrolls to and focuses the first available size instead of being a dead disabled button.
- **Complete the Entrance:** only when `metadata.complete_the_look` is an array of handles (deduplicated, self excluded, max 4), each fetched from Medusa; unresolved handles are dropped. "Add all · ₦total" only when every handle resolved **and** each piece has exactly one purchasable, priced variant (otherwise the customer must pick a size on that piece's page). Posts sequentially to `/api/cart/items`, reports partial failures by name, never shows server error text, updates the bag count. `complete_the_look?: string[]` added to `ProductEditorialMetadata`.
- **Related pieces:** existing product tiles under an Entrance heading.
- **Size guide sheet:** hairline table, sticky first column, scrollable region with a label.
- **Shell fix found while testing:** the floating "Privacy choices" button covered the phone tab bar's Search and Bag targets. It now lives in the footer's Service column (`PrivacyChoicesButton` reopens the prompt via an event); the consent panel sits above the tab bar on phones.
- **Test fix:** `e2e/design-system.spec.ts` looked for a size button named "M"; since §4 it is "Size M" (that test was failing on this branch).
- New pure modules: `lib/product-options.ts` (option kinds, availability, low stock, selection, CTA text) and `lib/add-all.ts`; `variantIsAvailable` now has one definition (re-exported by `lib/store.ts`).

### Checks (this session)

| Command | Result | Key output |
|---|---|---|
| `pnpm install --frozen-lockfile` | **pass** | |
| `pnpm typecheck` | **pass** | 5 projects |
| `pnpm lint` | **pass** | `12 problems (0 errors, 12 warnings)`, all `@next/next/no-img-element` (B6; Phase 1.3 moves media to `next/image`) |
| `pnpm test` | **pass** | `payment-paystack 56 passed`, `storefront 67 passed` (new: `product-options.test.ts`, `add-all.test.ts`, which covers sequential posting and partial failures) |
| `pnpm tokens:check` | **pass** | `Contrast check passed for 7 label themes and 6 palette pairs.` |
| `dotenv -e .env -- pnpm build` (fresh PG 16 database) | **pass** | types, payment-paystack, storefront, medusa `Done` |
| `pnpm test:e2e --trace off` | **pass** | `11 passed (20.6s)`: 5 design-system + 6 new PDP tests (size → CTA text, sold-out disabled, add to bag → success strip + bag count, Complete the Entrance "Add all" → bag count 3, unconfirmed modules absent, phone sticky bar → focuses size, axe WCAG 2.2 AA at 390 and 1440 px with zero violations) |
| Production standalone server + Playwright, `/p/test-agbada` | **pass** | 200; hydrated; no console errors at 390 or 1440 px; select 42 → "Add to bag — size 42", legend "Size — 42 · last one"; add → "Added to bag — Test agbada, Forest, size 42. View bag", header "Bag 1"; Add all → "Added all 3 pieces to your bag.", header "Bag 4"; no horizontal overflow at 390 px |

Screenshots (production build, mock catalogue): `docs/evidence/phase-2/pdp/pdp-390.png`, `pdp-1440.png`.

### New finding — same-origin check rejects writes off `localhost` (fixed later as audit N11, see §N11 below)
`lib/request-security.ts` compares `Origin` with `new URL(request.url).origin`. Next (dev and the production standalone server) reports `request.url` as `http://localhost:<port>` regardless of `Host`, `X-Forwarded-Proto` or `HOSTNAME`. Observed against the standalone server, `POST /api/cart/items`: `Origin: http://localhost:3000` → 200; `Origin: http://127.0.0.1:3000` → 403; `Host: shop.example` + `X-Forwarded-Proto: https` + `Origin: https://shop.example` → 403. Behind Coolify's proxy every cart and checkout write would likely be rejected. **Launch-blocking**, Phase 0 security code, so it is not changed in the design PR; queued as a separate task. Meanwhile `playwright.config.ts` uses `http://localhost:3017` as its base URL, with a comment pointing here.

### Phase 2 not yet done
§5.6 (bag, checkout, confirmation, track order, wishlist, search, stories, pages; the wishlist and `content.tsx` still show "Image pending"), §5.7 dev gallery, §6 Data Saver hover-preload check, §7 budgets (JS first-load and Lighthouse, not measured yet), remaining §8 e2e (hero, tab bar, label page) and "after" screenshots, §9 docs.

## §5.6 Bag, checkout, customer and editorial pages — 6 November 2026 (cloud session, continued)

Restyle only; the checkout flow, its requests and the API routes are unchanged (commit `c1f9692`).

- `.store-page` / `.page-shell` had **no side padding on phones** (only a ≥ 768 px width rule). They now use the Entrance container and gutter at every width.
- Bag: hairline lines, compact stepper, ink totals rule, 56 px "Continue to checkout"; summary column beside the lines from 768 px. Checkout: 48 px hairline inputs with a 2 px ink focus border, labels above with "(optional)" inline, hairline delivery rows, the order summary as a table (caption "Order summary"), errors in `--signal-text` wired with `aria-describedby`. Track order: `aria-invalid` only when the lookup rejects the details (400/404), not for a 503. Stories: Instrument Serif titles, 68ch bodies, `Breadcrumb`. Empty and error states use `EmptyState` / `ErrorState`.
- Customer-facing placeholder or internal copy removed: "Image pending" (wishlist, `CMSImage`), "Price unavailable", "Calculated by Medusa", "Medusa confirmed your checkout", "Guest order tracking and transaction emails will be added…", "Delivery zones and fees are being confirmed", "…payment account and approved channels still need to be configured", "Courier tracking details are not available here yet", "Account syncing will be added…", "Stories will appear here when they are published". The payment-failure line "Contact Lopaworld with your checkout email…" is unchanged (payment wording outranks looks), but it names no contact route until D5 is decided.
- The confirmation page does **not** link to Track an order: it shows Medusa's order ID, while the lookup needs the numeric order number, which the page never shows. Recorded as a follow-up.
- Checked against the production build with the mock catalogue at 390 and 1440 px: bag (empty and two lines), checkout, wishlist, track order (with an error), stories (empty), confirmation (unavailable). No horizontal overflow; no console errors except the expected 503 from the mock's missing order-lookup route.
- `e2e/bag-checkout.spec.ts` (new, 4 tests): empty bag, bag lines and totals, checkout labels and summary table, no placeholder copy, no overflow, axe WCAG 2.2 AA at 390/1440 on bag and checkout, and on wishlist, track order, stories and confirmation.

## §7 Performance budgets — 6 November 2026

**Not met as committed: LCP.** Stopped and asked (§10); options in **ADR-015** (`docs/DECISIONS.md`).

Method: production standalone build (`next build`, fresh PG 16 database), mock catalogue (16 fictional products, ≥ 12 required), Lighthouse 12.8.2 installed in a scratch directory (not a repo dependency), mobile defaults (Moto G Power, slow 4G), `--only-categories=performance`, median of 3 runs; a run that failed with Lighthouse's `NO_NAVSTART` trace error is excluded and counted. JS first-load: every same-origin script a fresh Moto G4 context loads, gzipped at level 6 (Next 16 Turbopack no longer prints per-route sizes).

| Page | JS first-load (gzip) | Simulated: score · LCP · TBT | Applied (`devtools`): score · LCP · TBT | CLS |
|---|---|---|---|---|
| `/` | 146.3 KB | 96 · 2.57 s · 105 ms | 94 · 2.21 s · 180 ms | 0.000 |
| `/l/trybe` | 146.6 KB | 96 · 2.56 s · 90 ms | 94 · 2.20 s · 147 ms | 0.000 |
| `/shop` | 146.6 KB | 96 · 2.57 s · 96 ms | 93 · 2.37 s · 231 ms | 0.000 |
| `/p/test-agbada` | 149.7 KB | 95 · 2.64 s · 151 ms | 92 · 2.31 s · 204 ms | 0.000 |

Budgets: JS ≤ 150 KB **pass** (PDP 0.3 KB under); score ≥ 90 **pass**; CLS ≤ 0.05 **pass**; TBT ≤ 200 ms **pass** simulated, 147–231 ms applied; **LCP ≤ 2.0 s fails** with both methods. Fonts: 2 preloaded files, 140 KB total (≤ 160 KB) **pass**.

Diagnosis: LCP equals first paint on every page (the display headline; the first product image on `/shop`). With applied throttling the document arrives at 1.2 s, then the 13.5 KB render-blocking stylesheet needs a further round trip while it shares the link with the preloaded fonts and the scripts (lands at 2.17 s). Before this change the PDP's LCP was the analytics prompt, painted only after hydration (simulated 3.16 s).

Experiments (each a separate production build; only E5's consent part is kept):

| | Change | Simulated LCP | Applied LCP |
|---|---|---|---|
| E1 | Archivo instanced to `wght` 400–900 | — | — (file only 112 → 109 KB; 83 KB if Latin Extended-A/B also dropped) |
| E2+E3 | Archivo `font-display: optional` + prompt suppressed | 2.71–3.01 s | 2.30–2.48 s |
| E4 | `experimental.inlineCss` only | 2.71–3.30 s | 1.50–1.65 s, PDP 3.80 s (prompt) |
| E5 | inline CSS + server-rendered prompt | 2.71–2.83 s | **1.51–1.63 s**, score 94–98, TBT 203–255 ms |

Kept: the **consent prompt is now server-rendered**. A pre-paint inline script in the root layout sets `html[data-consent-answered]` when a choice is stored, and CSS hides the server copy, so visitors who have answered never see it (checked before and after hydration with production chunks delayed). `CONSENT_KEY` moved to `lib/consent-key.ts` so the server layout can read it (`lib/analytics.ts` is a client module). `e2e/consent.spec.ts` (new, 4 tests) covers the server HTML and the three stored states with the app's scripts aborted, asserting React has not run.

Not kept, pending ADR-015: `experimental.inlineCss`. `pnpm test:lhci` is not added yet because its throttling method is the open decision.

### Checks (this session, after §5.6 and the consent change)

| Command | Result | Key output |
|---|---|---|
| `pnpm typecheck` | **pass** | 5 projects |
| `pnpm lint` | **pass** | `12 problems (0 errors, 12 warnings)`, all `no-img-element` |
| `pnpm test` | **pass** | 56 + 67 |
| `pnpm tokens:check` | **pass** | 7 label themes, 6 pairs |
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` (fresh database) | **pass** | |
| `pnpm test:e2e --trace off` | **pass** | `19 passed (36.7s)` |

Environment note: the container restarted mid-session (Postgres crash recovery in its log); the throwaway cluster was restarted and every build after that used a fresh database. Starting the standalone server **without** `HOSTNAME` made cart writes from `localhost` fail with 403 too, which is more evidence for the same-origin finding above.

## ADR-015 accepted, §5.7, §6, §8 and §9 — 6 November 2026 (cloud session, continued)

The owner chose **ADR-015 option 1**. Commits `e72493f` (inline CSS, `pnpm test:lhci`), `c3263b4` (gallery, flagged components, Data Saver), `609eeae` (checkout regression), `0d59a56` (screenshots), and the docs commit that follows.

- **§7 / ADR-015:** `experimental.inlineCss: true`; `pnpm test:lhci` = Lighthouse CI 0.15.1 (0.16.0 is under two weeks old, ADR-012), applied throttling gating performance ≥ 90, LCP ≤ 2.0 s and CLS ≤ 0.05, then simulated throttling gating TBT ≤ 200 ms; median of 3 runs per URL. In CI (run 21, commit `e72493f`) both passes ran 12 audits each with no failed assertion (step "Lighthouse budgets", 7 min 21 s). The report upload found nothing because `upload-artifact` skips dot-directories; fixed with `include-hidden-files: true`.
- **CLS regression found and fixed:** the final run measured CLS 0.048 on `/` (gate 0.05). The Drop section moved when Archivo arrived, because the overflow hardening added earlier (`overflow-wrap: anywhere` on the hero and label names) made "LOPAWORLD" wrap in the Arial fallback, which ignores `font-stretch: 62%`, and unwrap in Archivo. Now the names do not wrap and `.entrance-hero`/`.label-hero` clip horizontal overflow, so the height is identical before and after the swap. CLS 0.000 on all four pages afterwards.
- **§5.7:** `/dev/ui` (server page, 404 in production) shows the hero with three labels, the Drop, occasion tiles, every tile badge and both colour summaries, the mobile tab bar, the size selector with sold out and low stock, swatches with and without hex, sheets, the flagged `MadeToMeasurePanel` and `GroupOrderSection` (`TODO_CONFIRM` copy), plus the existing gallery. `/dev/type` unchanged. New stack smoke test: both return 404 in production.
- **§6:** the tile's second image is `loading="lazy"` but sits in the viewport at opacity 0 on desktop, so it downloaded under Data Saver. The pre-paint script now sets `html[data-save-data]` (saveData or 2g/3g, the same rule as `prefersReducedData`) and CSS gives the image `display: none`, which Chrome does not fetch; `prefers-reduced-data` is honoured too. Every transition uses the motion tokens.
- **§8 tests:** `e2e/entrance.spec.ts` (hero switch by pointer and keyboard: `data-label` and the CTA href; tab bar navigates and hides while typing; label category rail and `aria-current`; Data Saver on emulated 3G and off without it; gallery sections and axe at 360/1280; flagged modules absent from the storefront) and a checkout happy-path regression (bag → details → delivery → payment start with the `checkout.paystack.com` redirect answered by a stub → return → confirmation → empty bag). The mock's cart completion is idempotent, as Medusa's is: React's dev double effect sends two completion requests. The Lookbook toggle test asserts it stays hidden, because no campaign can be `active` (ADR-014).
- Overflow found by the gallery at 390 px: unbreakable flag names in gallery headings, the `Gallery` component's carousel stretching a grid cell (now `min-width: 0`), and the accordion chevron poking 4 px past its summary.
- **Screenshots:** `docs/evidence/phase-2/after/` (home, label, shop, PDP, bag with two lines, checkout at 360/390/768/1280/1440) and `docs/evidence/phase-2/compare/` (canvas beside implementation for home, label and PDP at 1440 and 390). The canvases render statically: `support.js` is not in the repo, so sample holes such as `{{bagCount}}` show literally, and their Google Fonts link is blocked (§3), so they render in system fonts. Proportions, hierarchy and type scale are comparable; the deliberate differences are the hidden modules listed in `OPEN_ITEMS.md` and the house-name hero (the test database has no Payload headline).
- **§9 docs:** ADR-016 (Entrance design system), ADR-017 (Phase 2 before Phase 1), ADR-018 (proposed follow-ups: `campaigns.products`, an `occasions` collection, splitting `@lopaworld/ui`); `OPEN_ITEMS.md` Phase 2 table of hidden modules and gates; `ENGINEERING-HANDOFF.md` design-system and CI sections; `packages/ui/fonts/README.md`.

### Final checks (this session, after all Phase 2 changes)

Environment: Linux cloud container, Node 22.23.4, pnpm 11.19.0, local PostgreSQL 16 (Docker Hub rate-limited; CI uses PostgreSQL 17), fictional mock Store API.

| Command | Result | Key output |
|---|---|---|
| `pnpm install --frozen-lockfile` | **pass** | |
| `pnpm typecheck` | **pass** | 5 projects |
| `pnpm lint` | **pass** | `12 problems (0 errors, 12 warnings)`, all `@next/next/no-img-element` (Phase 1.3) |
| `pnpm test` | **pass** | 56 + 67 |
| `pnpm tokens:check` | **pass** | 7 label themes, 6 palette pairs |
| `python3 packages/ui/scripts/check-font-glyphs.py` | **pass** | Archivo covers every required glyph; Noto Serif covers all 8 missing from a primary face |
| `pnpm audit:gate` | **pass** | 7 high, all allow-listed and unexpired (production dependencies only) |
| `pnpm test:e2e --trace off` | **pass** | `27 passed (52.9s)` |
| `dotenv -e .env -- pnpm build` (fresh database) | **pass** | types, payment-paystack, storefront, medusa `Done` |
| `pnpm test:lhci` (after the CLS fix) | **pass** | 0 failed assertions |

`pnpm test:lhci`, median of 3:

| Page | Applied: score · LCP · CLS | Simulated: TBT | JS first-load (gzip) |
|---|---|---|---|
| `/` | 97 · 1.52 s · 0.000 | 110 ms | 146.3 KB |
| `/l/trybe` | 98 · 1.50 s · 0.000 | 92 ms | 146.6 KB |
| `/shop` | 97 · 1.62 s · 0.000 | 100 ms | 146.6 KB |
| `/p/test-agbada` | 96 · 1.57 s · 0.000 | 132 ms | 149.7 KB |

Caveats: LCP was measured with the mock catalogue's tiny `data:` SVG images, so Phase 1 must re-run `pnpm test:lhci` with real media. Lighthouse CI brings dev-only advisories through its Puppeteer and proxy dependencies (`extract-zip`, `basic-ftp`, `tmp`, `zod`; some high). They run only in CI against our own pages and are outside the production audit gate.

## §N11 Same-origin check behind a proxy — 6 November 2026 (cloud session)

Fixes the finding above (audit **N11**, launch-blocking). Branch `claude/exciting-hamilton-ip3pr6`, stacked on `phase/2-entrance-design-gsv1of` because the standalone build, Vitest and `lib/env.ts` exist only there.

### What changed
- `lib/request-security.ts`: allowed origins are (1) `NEXT_PUBLIC_SITE_URL`'s origin, via `configuredSiteOrigin()` in `lib/env.ts`; (2) the `X-Forwarded-Host` (else `Host`) + `X-Forwarded-Proto` origin, **only** when `TRUST_PROXY_HEADERS=true` (runtime, off by default; first value of a comma list; plain `host[:port]` only); (3) `request.url`'s origin only when neither yields an origin (local dev and CI, where `.env.example` leaves the site URL empty). `Origin` → `Referer` → `Sec-Fetch-Site: same-origin` order is unchanged.
- Once a site URL is configured, `request.url`'s `http://localhost:3000` is **no longer** accepted.
- `lib/request-security.test.ts` (new, 16 tests): configured origin match; mismatch (other host, http vs https, subdomain, `null`, malformed); `request.url` = `http://localhost:3000` with configured `https://example.com`; Referer-only; Origin wins over Referer; Sec-Fetch-Site; forged forwarded headers ignored without the flag; trusted-proxy chain/Host fallback/malformed host/missing proto; dev fallback.

### Checks (this session)

| Command | Env | Result | Key output |
|---|---|---|---|
| `pnpm --filter @lopaworld/storefront test` | Linux container, Node 22 | **pass** | `11 passed (11)`, `83 passed (83)` |
| New test file against the **old** `request-security.ts` | same | **fails as expected** | `7 failed \| 9 passed (16)` |
| `pnpm --filter @lopaworld/storefront typecheck` | same | **pass** | |
| `pnpm --filter @lopaworld/storefront lint` | same | **pass** | `12 problems (0 errors, 12 warnings)`, all pre-existing `no-img-element` |
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` with `NEXT_PUBLIC_SITE_URL=https://shop.example` | fresh throwaway PG 16 on 5433 | **pass** | `▲ Next.js 16.4.5 (Turbopack)` |
| `pnpm test:e2e --trace off` (next dev on 127.0.0.1:3017, mock Medusa, site URL empty) | fresh throwaway PG 16, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` = pre-installed Chromium 1243 | **pass** | `27 passed (46.0s)` |

### Standalone proof
`node apps/storefront/.next/standalone/apps/storefront/server.js` with `NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3000`, mock Medusa (`e2e/support/mock-medusa.mjs 9100`), image built with `NEXT_PUBLIC_SITE_URL=https://shop.example`. The server is reached at `127.0.0.1:3000`, so `request.url` is `http://localhost:3000` (observed earlier in this file). `POST /api/cart/items` with `{"handle":"test-agbada","variantId":"prod_test_agbada_var_1","quantity":1}`:

| Request headers | Before (observed earlier) | After |
|---|---|---|
| `Origin: https://shop.example` | 403 (any non-localhost origin) | **200** (cart returned) |
| `Host: shop.example`, `X-Forwarded-Host: shop.example`, `X-Forwarded-Proto: https`, `Origin: https://shop.example` | 403 | **200** |
| `Referer: https://shop.example/p/test-agbada` only | 403 | **200** |
| `Sec-Fetch-Site: same-origin` only | 200 | **200** |
| `Origin: https://evil.example` | 403 | **403** |
| `Origin: http://localhost:3000` | 200 | **403** (no longer trusted once a site URL is set) |
| `X-Forwarded-Host: evil.example`, `X-Forwarded-Proto: https`, `Origin: https://evil.example` (flag off) | 403 | **403** |
| none of Origin / Referer / Sec-Fetch-Site | 403 | **403** |

Second server on port 3001 with `TRUST_PROXY_HEADERS=true`, `X-Forwarded-Host: staging.example`, `X-Forwarded-Proto: https`: `Origin: https://staging.example` → **200**; `Origin: https://shop.example` → **200**; `Origin: https://evil.example` → **403**.

### Operational note
`NEXT_PUBLIC_SITE_URL` is inlined at build time, so the production image must be built with the real origin (Coolify compose already requires it as a build arg). A local `.env` that sets it to another origin than the one you browse (e.g. `http://localhost:3000` while e2e uses `:3017`) makes cart writes 403 by design. Not verified behind the real Coolify/Traefik proxy: no deployment exists yet.
