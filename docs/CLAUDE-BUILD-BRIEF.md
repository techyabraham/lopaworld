# LOPAWORLD — BUILD BRIEF FOR CLAUDE

> **Status:** authoritative execution brief, issued 5 November 2026.
> **Supersedes:** the "Recommended next work" section of `docs/ENGINEERING-HANDOFF.md`. Every other repository rule in `AGENTS.md` still applies.
> **Companion files:** `docs/AUDIT-2026-11.md` (defects B1–B13 referenced below) and `CLAUDE.md` (standing rules).

---

## 0. MISSION

Turn this repository into the best fashion e-commerce experience serving Nigeria and its diaspora. Measurably faster, more useful and more distinctive than the leading Shopify stores (SSENSE, Mr Porter, Aimé Leon Dore, Kith). Then make it deployable to a single **Contabo VPS through Coolify** with a staging environment, off-site backups and a tested rollback.

You are the engineering lead. You own correctness, performance, security and documentation. The owner (Abraham, `techyabraham`) owns business facts and irreversible decisions.

**The four things that make Lopaworld better than everyone else (protect these at all costs):**

1. **Speed on Nigerian mobile networks.** Cached HTML at the edge, AVIF images, about 150 KB of JS.
2. **Made-to-measure as a product mode**, backed by a saved **Lopa Fit Profile**.
3. **Aso-ebi group orders**: one share link, each guest adds a size and pays their own share, and the host sees a live roster.
4. **Occasion-first discovery and WhatsApp-native service**, wrapped in a bold, Lagos-loud visual identity.

---

## 1. RULES OF ENGAGEMENT (non-negotiable)

1. **Read before writing.** At the start of every session read: `CLAUDE.md`, `AGENTS.md`, this brief, `docs/AUDIT-2026-11.md`, `docs/OPEN_ITEMS.md`, then the files you will touch. For Next.js behaviour, read `apps/storefront/node_modules/next/dist/docs/`: Next 16 differs from your training data (e.g. `middleware.ts` → `proxy.ts`, Cache Components). For Medusa and Payload, check the installed version's docs before using any module path in this brief. **If this brief names an API that does not exist in the installed version, use the equivalent from the docs and record the difference in `docs/DECISIONS.md`.**
2. **Never invent business facts.** Prices, stock, delivery fees and times, return terms, contacts, legal text, label positioning and media rights come only from the owner. Use `TODO_CONFIRM:` in code and docs. **In the UI, hide any module whose facts are missing.** Do not show placeholder sentences like "details will be available after confirmation" to customers.
3. **Stop at Decision Gates (§8).** When a task hits one, do all the preparatory work, write the options and a recommendation in `docs/DECISIONS.md`, then stop and ask. Do not guess.
4. **Never, without explicit written owner approval in the conversation:** deploy to production, change DNS, use live Paystack keys, make a real charge or refund, delete or restore a database, remove a volume, force-push, or rewrite `main` history.
5. **Secrets** live only in Coolify and GitHub Actions secrets. Never print them, commit them, or put them in client bundles. Only `NEXT_PUBLIC_*` values may reach the browser.
6. **Git:** one branch per phase (`phase/0-stabilise`, `phase/1-performance`, …). Use conventional commits and small commits. Open a PR per phase with the evidence template (§10). Never commit to `main` directly.
7. **Evidence or it didn't happen.** Never claim a check passed unless you ran it in this session. Record command, environment, and result (pass/fail with the key output lines) in `docs/evidence/phase-<n>.md`.
8. **Use a task list** for every phase, and tick items as they complete.
9. **Keep docs true.** At the end of each phase update `docs/ENGINEERING-HANDOFF.md` and any focused doc you affected. Describe observed behaviour, not intentions.
10. **Back-compat migrations only.** Every schema change must be *expand → migrate → contract*, so the previous image can still run against the new schema (this is what makes rollback safe).

---

## 2. CURRENT STATE (ground truth)

- **Monorepo:** pnpm 11.19.0, Node 24.15.0. `apps/storefront` (Next 16.4.0 + Payload 3.90.2 in the same app), `apps/medusa` (Medusa 2.21.2), `packages/{types,ui,payment-paystack,logistics}`.
- **Good and worth keeping:** the Medusa/Payload data boundary, the Paystack provider (`packages/payment-paystack/src/service.ts`), same-origin checks, the published-product validator, guest lookup that returns status only, the docs discipline, and the font-glyph and contrast check scripts.
- **Broken or missing:** see audit §2 (B1–B13) and §3. In short: no production build (Next security block), no Payload migration, single Medusa process, local-disk media, uncached dynamic pages, in-memory catalogue filtering, no search engine, no accounts, generic design, no differentiating features, deploy files never run.

---

## 3. TARGET ARCHITECTURE

```
                    Cloudflare (DNS proxied, Full-strict TLS, cache rules, WAF, Turnstile)
                                         │ 443
┌──────────────────────── Contabo VPS (Ubuntu 24.04 LTS) ─────────────────────────────┐
│ Coolify v4  ── Traefik proxy                                                         │
│                                                                                      │
│  [Compose app "lopaworld" — images pulled from GHCR, never built here]               │
│    storefront      Next 16 standalone + Payload    :3000  ← www.<domain>              │
│    medusa-server   MEDUSA_WORKER_MODE=server       :9000  ← api.<domain> (+/app admin)│
│    medusa-worker   MEDUSA_WORKER_MODE=worker, admin disabled, no public port         │
│    meilisearch     pinned v1.x, master key, volume  :7700  internal only              │
│                                                                                      │
│  [Standalone resources — separate lifecycle, Coolify scheduled backups → R2/B2]      │
│    postgres-17     dbs: lopaworld (medusa schema public, payload schema "payload")    │
│    redis-7         password, AOF on; Medusa event bus/workflows/locking/cache         │
│                                                                                      │
│  [Ops]  uptime-kuma (one-click) · Coolify notifications                              │
└──────────────────────────────────────────────────────────────────────────────────────┘
   Cloudflare R2 bucket(s): media (Payload + Medusa) · backups (Postgres dumps, separate bucket + key)
   GitHub Actions: CI → build → push ghcr.io/techyabraham/lopaworld-{storefront,medusa}:<git-sha> → Coolify deploy webhook
   Sentry: storefront + medusa (errors + traces, PII scrubbed)
```

**Staging** is a second Coolify environment on the same VPS with its **own** databases, R2 prefix, Meilisearch and Paystack *test* keys. It runs at `staging.<domain>` behind Cloudflare Access, so only the owner and team can reach it.

**VPS sizing (verify current Contabo plans):** with staging co-hosted, target **≥ 8 vCPU / 24 GB RAM / 200 GB NVMe**. Production-only can start at 6 vCPU / 12 GB. Because images are built in CI, the VPS needs no build headroom.

---

## 4. PHASES

Work strictly in order. A phase is done only when **every** acceptance criterion has evidence.

### PHASE 0 — STABILISE (make it build, boot and stop losing orders)

**Tasks**
0.1 `git status` and `git log`. Preserve any uncommitted work, and inspect the `next-env.d.ts` diff per the handoff.
0.2 Fix **B1**: completion must look at the *current* cart first. Use the order cookie only to render the confirmation page, never to short-circuit completion. Clear it at the start of a new checkout.
0.3 Fix **B2**: do not cache a `null` or a rejection. Use a TTL (e.g. 5 min) and retry on the next call.
0.4 Fix **B3**: validate the cart on read. If it is missing, completed or in the wrong region, create a new cart and reset the cookie.
0.5 Fix **B12**: return a generic error message to the browser and log the detail server-side.
0.6 Upgrade Next.js to the **latest patched 16.x** that clears the security block. Bump `eslint-config-next` with it. Regenerate the lockfile. Run `pnpm audit --prod` and fix or record each high/critical finding.
0.7 Payload: switch to `postgresAdapter({ …, prodMigrations: migrations })`, imported from `src/migrations/index.ts`. Create a fresh **local** Postgres (a new compose project or database name; **do not delete the existing volume**). Generate `initial_schema` with the Payload CLI from inside `apps/storefront`; if the CLI's TypeScript loading still fails, use whatever runner the installed Payload docs specify. Review the SQL and commit it. Remove `payload migrate` from the Dockerfile `CMD` (fixes **B8**).
0.8 Medusa production artefact: `medusa build`, then run from `.medusa/server` with production dependencies only. Resolve `workspace:*` dependencies, e.g. by building `@lopaworld/payment-paystack` into `dist` and using `pnpm deploy --prod`, or the method the docs recommend. Prove it with a clean Linux build (CI runner or a `docker build` here).
0.9 Dockerfiles: multi-stage, `node:24.15.0-bookworm-slim`, non-root, **storefront `output: 'standalone'`**, copy only `.next/standalone`, `.next/static` and `public`. Target images ≤ 400 MB storefront and ≤ 600 MB Medusa. Add a `.dockerignore` audit (fixes **B9**).
0.10 Health endpoints:
 - storefront `GET /api/health`: 200 with no dependencies.
 - storefront `GET /api/ready`: Payload db ping plus a Medusa `/health` call, 2 s timeouts.
 - Medusa built-in `/health`.
 Point compose healthchecks at `/api/health` (fixes **B10**).
0.11 CI (`.github/workflows/ci.yml`):
 - add a `postgres:17` service and Redis
 - run `typecheck`, `lint`, unit tests (add **Vitest**), `tokens:check`, glyph check, `build`
 - Playwright against a booted stack
 - fail on any high/critical `pnpm audit --prod` finding
 - add **gitleaks**
 Make the build green on GitHub.
0.12 Tests: unit tests for B1–B3 regressions and for every Paystack provider method. Cover amount/currency/reference mismatch, bad signature, duplicate webhook, and `toMinorUnits` rounding (e.g. 1999.995).

**Acceptance**
- [ ] CI is green on the PR (link the run).
- [ ] `docker build` succeeds for both images on Linux. Sizes are recorded.
- [ ] A fresh empty Postgres plus `docker compose up` (local stack using the built images) boots. Payload admin loads, the Medusa admin loads, and `/api/ready` returns 200.
- [ ] Regression tests for B1–B3 fail on the old code and pass on the new code (show both).

---

### PHASE 1 — PRODUCTION BACKBONE (Medusa modules, media, search, caching)

**Tasks**
1.1 **Medusa Redis modules.** Configure the event bus, workflow engine, locking and caching modules with their Redis providers (use the module paths for 2.21.x from the docs). Add `workerMode: process.env.MEDUSA_WORKER_MODE` and `admin.disable` driven by `DISABLE_MEDUSA_ADMIN`. Set `admin.backendUrl` to the public API URL.
1.2 **Media → Cloudflare R2.**
 - Medusa: S3 file provider (`file_url` = the public R2 custom domain such as `media.<domain>`, `prefix` per environment).
 - Payload: `@payloadcms/storage-s3` for `media`, keeping the existing image sizes and adding AVIF/WebP output.
 - Local development keeps MinIO with the same code path.
 Fixes **B5**.
1.3 **Images:**
 - add `images.remotePatterns` for the media host
 - set `formats: ['image/avif','image/webp']`
 - replace every raw `<img>` with `next/image` and correct `sizes`
 - add a blur placeholder (store a tiny LQIP string in metadata at upload time)
 Fixes **B6**.
1.4 **Search and listings with Meilisearch.**
 - A Medusa module or subscriber indexes products on `product.created`, `product.updated`, `product.deleted`, `inventory-level.updated` and `price` changes. Include a full re-index admin script.
 - Indexed document: id, handle, title, label, categories, occasions, colours, sizes, min_price_ngn, in_stock, purchase_modes, created_at, image, image_lqip.
 - Settings: filterable on label/category/occasion/size/colour/in_stock/purchase_modes; sortable on price, created_at.
 - Synonyms, owner-reviewable, in `apps/medusa/src/search/synonyms.json`: e.g. agbada ↔ agbadda ↔ agbádá; senator ↔ native ↔ two-piece native; kaftan ↔ caftan ↔ jalabiya ↔ jalamia; buba; iro; gele; fila; aso-oke ↔ aso oke ↔ asooke; aso-ebi ↔ asoebi; owambe.
 - Diacritic-insensitive matching.
 - The storefront PLP, label pages, category pages, occasion pages and `/search` all query Meili server-side with real pagination. Facet counts come from Meili.
 Fixes **B4**.
1.5 **Caching.**
 - Enable Cache Components (read the docs).
 - Remove `force-dynamic` from the store layout.
 - Catalogue/CMS reads use `'use cache'` with `cacheTag` (`product:<handle>`, `label:<slug>`, `listing:<key>`, `cms:<collection>:<slug>`, `homepage`) and a sensible `cacheLife`.
 - Cart, checkout, account, and anything reading cookies stay dynamic inside Suspense boundaries, so pages stream a cached shell.
 - Add `POST /api/revalidate` (HMAC secret, same-origin exempt, rate-limited). It is called by a Medusa subscriber (product/inventory/price/collection events) and by Payload `afterChange`/`afterDelete` hooks.
 Fixes **B7**.
1.6 **Edge.** Send `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` on cacheable HTML. Never send it on any response that sets a cookie or reads cart/session. Document the Cloudflare cache rules in `docs/COOLIFY-CONTABO.md`.
1.7 **Rate limiting** with a Redis sliding window:
 - Medusa middleware on `/store/orders/lookup` (5/min/IP plus 20/day/email hash)
 - storefront `/api/track-order`, `/api/revalidate`, and cart mutations (60/min/IP)
 - Cloudflare Turnstile on order lookup and on group-order join (Phase 4)
 Fixes **B11**.
1.8 **CSP.** Use a nonce-based CSP generated in `proxy.ts`. Remove `'unsafe-inline'` from `script-src`. Add `report-to` and an allow-list per integration (Paystack, GA, Meta, Sentry, R2, Turnstile). Payload admin may need a separate, looser policy scoped to `/admin`. Fixes **B13**.
1.9 **Observability.** Sentry SDK in both apps with PII scrubbing (emails, phones, addresses) and a release equal to the git SHA. Use structured JSON logs (pino) with request IDs propagated storefront → Medusa.

**Acceptance**
- [ ] Load 500 synthetic products into local Medusa. Listing, filtering, facet counts and pagination are correct past product 100. Typo searches return results: `agbadda`, `kaftan` → jalamia, `asooke`.
- [ ] Editing a product price in Medusa admin shows on the PDP and PLP within **10 s** with no redeploy.
- [ ] A PDP served twice: the second response comes from cache (logged); the cart stays correct.
- [ ] Upload images in both admins, redeploy both containers, and the images still serve from the R2 domain.
- [ ] The 6th lookup in a minute returns 429.
- [ ] No CSP violations in the console across home, PLP, PDP, bag, checkout and `/admin`.

---

### PHASE 2 — DESIGN SYSTEM REBUILD ("The Entrance")

> **Gate D1 applies.** Implement on the branch and show staging screenshots, but do not merge to `main` until the owner approves the direction. The reference is the owner's design canvas "LopaWorld Storefront" (desktop home, label page, PDP, mobile home).

**Tokens.** Replace `packages/ui/tokens/tokens.css`. Keep the variable names consumed by the existing components where possible.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0F0E0D` | Text, dark panels, primary buttons |
| `--paper` | `#F7F6F3` | Page ground |
| `--rule` | `#DAD6D0` | Hairlines, borders |
| `--muted` | `#5E5A55` | Secondary text (6.33:1 on paper) |
| `--muted-on-ink` | `#C9C4BD` | Secondary text on ink (11.1:1) |
| `--signal` | `#D93A1E` | **Fills only** behind white text (4.59:1) and display-size type: live badges, bag count |
| `--signal-text` | `#B8301A` | Any red text at body size (5.59:1 on paper) |
| `--label-tone-<slug>` | photography-derived dark tones (canvas values are provisional `TODO_CONFIRM:`) | Hero and label backgrounds only, never UI controls |

- **Radius:** 0 everywhere, except a 50% radius for circular avatars and story rings.
- **Shadows:** none, apart from a focus ring. Depth comes from hairlines and tone.
- **One accent rule:** red appears only for *live*, *low stock*, *error* and the *bag count*.

**Type.**
- Display: **Archivo** variable (`wdth` 62–125, `wght` 100–900), used at `font-stretch: 62%`, weight 900, uppercase, `line-height: 0.86`.
- Voice: **Instrument Serif** italic, for the second line, pull quotes and story titles.
- Interface: Archivo at normal width, 400/500/600/700.
- Self-host the woff2 files with OFL licences beside them. **Run `check-font-glyphs.py` extended to the new faces.** If Archivo lacks ₦ or Yoruba tone-marked vowels (ẹ́ ọ̀ ṣ etc.), keep the Noto fallback via `unicode-range`.
- Fluid scale: display `clamp(72px, 11vw, 176px)`, h2 64, h3 30, body 16, small 13, label 11–12 with 0.14–0.2em tracking.

**Signature components** (accessible, keyboard-complete, axe-clean):
1. **Entrance Hero.** A label index changes the whole hero's tone, film and copy without a page load. Use roving-tabindex tabs, a 600 ms colour transition, and none under `prefers-reduced-motion`. Video is an 8 s muted loop with the poster image as LCP. Do not load the video when `Save-Data` is set, `navigator.connection.saveData` is true, or `effectiveType` is 2g/3g.
2. **Occasion tiles** (Owambe, The wedding, Sallah & Eid, The boardroom, Friday out, December home), sourced from a Payload `occasions` collection, querying Meili across labels.
3. **The Drop:** a live product rail with label filter chips (real `aria-pressed` buttons).
4. **Product tile:** 3:4 image, a second image on hover/focus (desktop only), one honest badge from data (Made to measure / Low stock N / New / Lagos same-day *only if D4 is confirmed*), label eyebrow, NGN price.
5. **PDP buy panel:**
 - Ready-to-wear / Made-to-measure tabs (Phase 3 makes MTM real)
 - swatches
 - a size grid with sold-out strike-through and "1 left" in the aria-label
 - fit-match line (Phase 3)
 - delivery estimator (hidden until D4)
 - a sticky mobile add-to-bag that respects the on-screen keyboard
 - "Ask a tailor on WhatsApp" (hidden until D5)
 - **Complete the Entrance** cross-label bundle with "Add all"
6. **Label page:** a big condensed title, Grid ⇄ **Lookbook** toggle (editorial looks, each with shoppable pieces and "Add the full look"), a category rail with counts, and filter chips.
7. **Mobile:** an Instagram-style story ring as the label switcher, a thumb-zone bottom bar (Home, Labels, Saved, Stylist, Bag), and sheets instead of modals.
8. **Footer:** a huge LOPA wordmark and a drop-alert sign-up (wired in Phase 5).

**Content rules:** hide empty modules. Never show placeholder copy. Campaign lines ("Look important. Be important.") stay `TODO_CONFIRM:` until gate D2. Until approval, render them from Payload, not hard-coded.

**Performance budgets** (enforced in CI by Lighthouse CI against the local production stack):
- JS first-load ≤ **150 KB** gzip on home, PLP and PDP. Checkout ≤ 200 KB.
- Mobile Lighthouse (Moto G Power, slow 4G) performance ≥ **90**, LCP ≤ **2.0 s**, CLS ≤ **0.05**, TBT ≤ 200 ms.
- Real-user INP ≤ 200 ms, via `web-vitals` sent to analytics after consent.
- Hero image ≤ 120 KB AVIF at 390 w. No web fonts block render (`font-display: swap` and size-adjusted fallbacks).

**Acceptance**
- [ ] Storybook-style dev gallery at `/dev/ui` (still 404 in production) shows every component in every state. Playwright + axe pass with zero serious/critical violations.
- [ ] Lighthouse CI budgets pass on home, a label page, PLP and PDP.
- [ ] Screenshots at 360, 390, 768, 1280 and 1440 px in `docs/evidence/phase-2/`.
- [ ] Keyboard-only browse → add to bag → checkout completes, with visible focus throughout.

---

### PHASE 3 — ACCOUNTS + MADE-TO-MEASURE (Lopa Fit Profile)

> **Gates D3 (account policy) and D6 (MTM rules) apply.**

3.1 **Accounts:** Medusa customer auth (email + password; optional phone OTP via a Nigerian SMS/WhatsApp provider if D3 approves).
 - Guest checkout stays first-class.
 - Saved addresses, order history, server-synced wishlist (migrate the localStorage wishlist on first sign-in).
 - Password reset by email.
 - httpOnly session cookie set by the storefront server. Never put a JWT in localStorage.
3.2 **MTM pricing stays in Medusa.** Model it as a variant option `Fit: Ready-to-wear | Made to measure` on eligible products, so each has its own price, SKU and inventory policy (MTM = `manage_inventory: false`). Product metadata `purchase_modes`, `lead_time_days`, `garment_family` (agbada, senator, suit, gown, …). Extend `validate-published-products.ts` to enforce this.
3.3 **Fit module** (`apps/medusa/src/modules/fit`):
 - `FitProfile`: id, customer link, `garment_family`, unit `cm`, `source` (studio | video | self), `measurements` (JSON validated by a zod schema per garment family, kept in `packages/types`), `verified_at`, `verified_by`, `notes`, `created_at`.
 - Profiles are **immutable versions**: edits create a new version, and line items reference the version id.
 - Store API: list/create profiles for the authenticated customer.
 - Admin: an order-page widget showing the snapshot.
 - The guided self-measure flow uses illustrated steps per measurement, cm/in toggle, range validation with a "this looks unusual" check, and an optional photo upload to a private R2 prefix with signed URLs only.
3.4 **Cart integration.** Adding an MTM variant requires choosing or creating a profile. Line-item metadata stores `fit_profile_version_id`, and the server enforces it. An optional **event date** field rejects or flags dates earlier than today + `lead_time_days`, and shows "Ready by <date>".
3.5 **Atelier module** (`modules/atelier`):
 - A `ProductionJob` per MTM line item.
 - Stage enum: received → cut → sewn → finishing → fitting → ready → dispatched, with an append-only history (who, when, note), plus an ETA.
 - Admin widget to advance stages.
 - Store route for the customer timeline (account and guest-lookup views).
 - Each stage change emits an event for Phase 5 notifications.
3.6 **Fit match on PDP.** If the signed-in customer has bought this label or garment family before, show "You bought <size> in <label>". Only state what is computed from their own orders. No statistical claims unless real data exists.

**Acceptance:** E2E: sign up → create profile → add MTM agbada with event date → checkout (Paystack test) → admin advances stages → customer sees the timeline. A second order reuses the profile in one tap. Ownership checks: customer A cannot read B's profiles (test this).

---

### PHASE 4 — ASO-EBI GROUP ORDERS

> **Gate D7 (group rules) applies.**

4.1 **Module** `modules/group_order`:
 - `GroupOrder`: id, host customer, title, event_date, deadline, `payment_mode` (per_guest | host_pays), allowed variants/products, status (open | locked | fulfilled | cancelled), `share_token` (128-bit random, stored hashed).
 - `GroupMember`: name, phone (E.164), chosen variant/size **or** fit_profile_version, cart_id, order_id, status (invited | sized | paid | cancelled).
4.2 **per_guest:** each guest opens `/g/<token>`, has Turnstile, picks a size or measurements, and gets their **own Medusa cart** (metadata `group_order_id`) and their own Paystack payment. **host_pays:** one cart with one line item per member and member metadata.
4.3 **Host dashboard** `/account/groups/<id>`: live roster (who's in, sized, paid), "nudge on WhatsApp" deep links (`https://wa.me/<phone>?text=` with a prefilled message), copy share link, lock group. Use polling every 10 s or SSE; avoid websockets on the VPS.
4.4 **Worker scheduled job:** on deadline, lock the group, notify the host, and release unpaid carts.
4.5 **Abuse controls:** rate limits on join, maximum members (from D7), and token rotation.

**Acceptance:** E2E with 3 simulated guests (2 pay, 1 doesn't). The roster is correct, the deadline locks the group, and orders are linked in admin.

---

### PHASE 5 — MESSAGING, NOTIFICATIONS, GROWTH

5.1 **Transactional email** as a Medusa Notification Module provider (Resend or Postmark per D8), with React Email templates: order placed, payment failed, shipped, MTM stage change, group invite/deadline, password reset. Templates go in `packages/emails`. Set up SPF/DKIM/DMARC on the sender domain and record it in the runbook.
5.2 **WhatsApp:**
 - (a) click-to-chat CTAs once D5 confirms the number.
 - (b) optional WhatsApp Business Cloud API notification provider for order and MTM updates once D5 confirms Meta business verification and approved templates.
 Opt-in is required and stored per customer.
5.3 **Drop alerts and back-in-stock:** consented sign-up (email or WhatsApp) stored in Medusa (a customer or subscriber module) with double opt-in, one-click unsubscribe, and a deliver-once guarantee via an idempotency key.
5.4 **Analytics:** GA4 (existing consent gate) plus **Meta Conversions API sent server-side from a Medusa `order.placed` subscriber**, with hashed identifiers and only when consent is recorded on the cart. Use the existing event schema in `@lopaworld/types`, and add `group_order_*`, `fit_profile_*` and `occasion_select`.
5.5 **Feeds:** make Google and Meta feeds valid with real data (variant-level items, `item_group_id`, availability, NGN price, image). Add a validation script.
5.6 **Multi-currency display** (gate D9): checkout stays **NGN only** unless D9 approves USD on Paystack. The optional display conversion shows "≈ $X", "approx." and the rate date, with rates from an owner-approved source refreshed daily by the worker. Never show it at checkout as a charge amount.

---

### PHASE 6 — HARDENING & LAUNCH READINESS

6.1 **Full E2E suite** (Playwright, mobile and desktop projects): label navigation, search with typos, facets, variant selection, sold-out, bag edits, invalid checkout, shipping selection, Paystack test-mode success/decline/abandon, webhook duplicate and tamper, return page, order lookup, account, MTM, group order.
6.2 **Load test** with k6 against staging: 50 concurrent users browsing plus 5 checkouts per minute for 10 min. p95 < 800 ms uncached and < 150 ms cached, error rate < 0.5%. Record CPU and RAM per container.
6.3 **Security:**
 - OWASP ZAP baseline against staging
 - dependency and secret scans green
 - cookie flags verified
 - admin routes behind Cloudflare Access or an IP allow-list (D10)
 - Medusa admin users with strong passwords and 2FA where supported
 - a written NDPA data-flow inventory (what personal data, where, retention, deletion path) for the legal reviewer
6.4 **Backup and restore drill:** restore the latest Postgres backup from R2 into a scratch database, row-count critical tables, measure RTO/RPO, and record the results.
6.5 Complete `docs/PHASE-7-QA-CHECKLIST.md` with evidence.

---

## 5. DATA MODEL DECISIONS TO RAISE (do not change silently)

- **"Lopaworld" as a label slug.** Recommend making it the *house*, not a label: products need one of the real labels, and the homepage/parent pages represent the house. The master brief fixed seven slugs, so this is **gate D11**. Implement nothing until it is answered.
- **Lopa Bridal:** keep it, but hide the route until it has published products (D2).
- **Occasions** become a Payload collection (editorial) plus a Medusa product metadata array `occasions[]` (assignment). Validate the slugs against the Payload list at publish time.

---

## 6. COOLIFY + CONTABO DEPLOYMENT SPEC (write it as `docs/COOLIFY-CONTABO.md` v2, then rehearse on staging)

**Server baseline**
- Ubuntu 24.04 LTS. Non-root sudo user with an SSH key. Password auth and root login off. `unattended-upgrades` and `fail2ban` installed.
- **Contabo network firewall:** 22 from the owner's IPs only; 80/443 from **Cloudflare IP ranges only** once proxied.
- **Do not rely on UFW alone.** Docker publishes ports past UFW rules, so no service may publish a host port except Traefik's 80/443. Verify with `ss -tlnp` and an external `nmap`.
- Coolify installed with the official script. Dashboard on `coolify.<domain>` behind Cloudflare Access. Ports 8000/6001/6002 closed publicly after setup. Back up `/data/coolify/source/.env` off-server.

**Resources**
1. **Postgres 17** standalone resource:
 - strong password
 - not publicly exposed
 - scheduled backups daily at 02:00 WAT to the R2 backups bucket
 - retention 14 daily + 8 weekly
 - a test restore in Phase 6
 - production and staging are **separate** resources
2. **Redis 7** standalone: password, AOF `everysec`, not exposed.
3. **Compose app** from `coolify.compose.yaml` v2:
 - services `storefront`, `medusa-server`, `medusa-worker`, `meilisearch`
 - **`image: ghcr.io/techyabraham/lopaworld-<svc>:${IMAGE_TAG}`**, no `build:`
 - enable Coolify's "Connect to predefined network" so the services reach the standalone DB and Redis by their internal hostnames
 - Meilisearch has a volume and a master key, with no domain
 - resource limits per service (`mem_limit`), starting at storefront 1.5 G, medusa-server 1.5 G, worker 1 G, meili 1 G; tune from load-test data
4. **Domains:**
 - `www.<domain>` → storefront:3000
 - `api.<domain>` → medusa-server:9000
 - apex → 301 to www (Cloudflare redirect rule)
 - `media.<domain>` → R2 custom domain
5. **Env vars:** one table in the doc listing every variable with service, scope (build/runtime), example format and secret yes/no. Build-time `NEXT_PUBLIC_*` values become GitHub Actions *variables* used at image build. Runtime secrets live only in Coolify.

**CI/CD**
- `ci.yml` (PRs): quality gates.
- `release.yml` (push to `main` and manual):
 1. build both images with BuildKit cache
 2. tag them `sha-<short>` and `staging`
 3. push to GHCR
 4. call the **staging** Coolify deploy webhook (token in secrets)
 5. run smoke tests against staging
- **Production promotion is a manual `workflow_dispatch`** that retags a tested SHA as `prod` and calls the production webhook. It requires GitHub environment protection with the owner as required reviewer.
- **Rollback:** dispatch the workflow with the previous SHA. Schema changes are backward compatible (rule 1.10), so no database restore is needed for an app rollback.

**First-deploy order (staging, then production)**
1. Databases up.
2. medusa-server and medusa-worker up (they run migrations).
3. Create a Medusa admin user, NGN region, sales channel and publishable key.
4. Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` as a GH variable and re-run the release.
5. Storefront up (Payload `prodMigrations` run on init).
6. Create the Payload admin.
7. Re-index Meili.
8. Smoke tests.
9. Paystack **test** webhook → `https://api.<domain>/hooks/payment/paystack_paystack`, verified reachable.

**Cloudflare**
- SSL Full (strict).
- Cache rules: bypass for `/admin*`, `/app*`, `/api/*`, `/checkout*`, `/bag`, `/account*`, `/g/*`. Cache everything else respecting origin headers.
- Brotli on. WAF managed rules on. Bot Fight mode reviewed for false positives against the Paystack webhook (create a skip rule for the webhook path on api).

---

## 7. QUALITY BARS (apply everywhere)

- TypeScript `strict`. No `any` in new code. zod at every trust boundary (request bodies, webhooks, CMS JSON, env vars via one `env.ts` per app that fails fast).
- Accessibility WCAG 2.2 AA: real buttons and links, labels, focus management in sheets, `aria-live` for bag and price updates, 44 px targets, logical heading order.
- Errors: user-facing messages are short and human. Internal detail goes to logs and Sentry only.
- Money is always integer minor units in our own code paths. Format with `Intl.NumberFormat('en-NG', …)`. Never use floats for arithmetic.
- No new runtime dependency without a one-line justification in the PR. Prefer the platform.

---

## 8. DECISION GATES (stop and ask; write options + recommendation first)

| ID | Decision | Blocks |
|---|---|---|
| D1 | Approve the "Entrance" visual direction, tokens and fonts | Merging Phase 2 |
| D2 | Approve campaign lines, label names/spelling, Bridal scope, label tones | Publishing hero copy, Bridal route |
| D3 | Account policy: email only or + phone OTP; provider | 3.1 OTP |
| D4 | Delivery zones, fees, cut-offs, same-day Lagos eligibility | Delivery estimator, "Lagos same-day" badge, shipping options |
| D5 | Official WhatsApp number, hours, Meta business verification | WhatsApp CTAs and API |
| D6 | MTM rules: eligible products, lead times, measurement sets, alteration/refund policy | Phase 3 live |
| D7 | Group order rules: min/max members, deadlines, discounts, cancellation | Phase 4 live |
| D8 | Email provider and sender domain | 5.1 |
| D9 | Display currencies and rate source; USD charging on Paystack? | 5.6 |
| D10 | Admin access method (Cloudflare Access vs IP allow-list) | 6.3 |
| D11 | Treat "Lopaworld" as house instead of label slug | §5 |
| D12 | Production domain, Cloudflare account access, Contabo plan, R2 account | Phase 6 deploy |
| D13 | Approve the real low-value production order and its maximum amount | Go-live |

---

## 9. DEFINITION OF DONE (whole programme)

- Production on Coolify/Contabo behind Cloudflare. Staging mirrors it. Release and rollback have both been rehearsed.
- Lighthouse mobile ≥ 90 on key pages with real catalogue data. Real-user Core Web Vitals green at p75 after 14 days.
- One approved real order placed → verified → emailed → tracked → refunded → reconciled (D13).
- Backup restore drill passed with recorded RPO ≤ 24 h and RTO ≤ 2 h.
- Every `TODO_CONFIRM:` is resolved or its module is hidden. `OPEN_ITEMS.md` is current.

---

## 10. REPORTING FORMAT (every PR and every end-of-session message)

```
## Phase <n> — <title>  ·  branch <name>  ·  commit <sha>
### Done
- <task id> <one line> — evidence: <command> → <result>
### Not done / blocked
- <task id> — <reason> — needs: <gate id or owner input>
### Checks run (this session)
| Command | Env | Result |
### Risks / follow-ups
### Docs updated
```

---

## 11. FIRST SESSION — DO EXACTLY THIS

1. Read the files listed in Rule 1.
2. Create the Phase 0 task list (0.1–0.12).
3. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` and `pnpm build`. Record the real failures. Confirm or refute each audit item B1–B13 with file and line numbers. Update `docs/AUDIT-2026-11.md` with the verified status.
4. Start Phase 0 on branch `phase/0-stabilise`, beginning with B1 (it can lose orders).
5. End with the §10 report.
