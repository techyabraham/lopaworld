# Architecture decisions

## ADR-001 — Use the fixed commerce stack

- Status: Accepted
- Date: 2026-10-09
- Decision: Use Next.js App Router and TypeScript, Payload CMS v3 in the storefront app, Medusa v2 for commerce, PostgreSQL, Redis, and pnpm workspaces.
- Context: These technologies are explicitly fixed in the project brief.
- Consequences: The stack uses a shared monorepo and database service; Payload tables use a dedicated PostgreSQL schema. Versions must be kept compatible and pinned in the lockfile.

## ADR-002 — Start with one local Medusa process

- Status: Accepted for local development
- Date: 2026-10-09
- Decision: Use Medusa's shared worker mode locally for a simple `pnpm dev`; production will run server and worker as distinct processes.
- Context: The local foundation should have a single command while preserving separate production operations.
- Consequences: Worker/server separation, queue sizing and production deployment configuration remain to be implemented and documented before launch.

## ADR-003 — Keep local object storage S3-compatible

- Status: Accepted for local development
- Date: 2026-10-09
- Decision: Provide MinIO through Docker Compose; production media storage will use Cloudflare R2 behind a CDN.
- Context: Local development needs a no-cloud-cost object store that exercises the S3-compatible path.
- Consequences: The MinIO bucket and Medusa/Payload upload adapters still need configuration in the relevant implementation phase.

## ADR-004 — Keep owner-supplied business rules explicit

- Status: Accepted
- Date: 2026-10-09
- Decision: Unconfirmed product taxonomy, brand content, delivery, returns, payment scope, size data, contacts and legal information remain `TODO_CONFIRM:` and must not be presented as factual claims.
- Context: The project brief prohibits invented business facts.
- Consequences: Track unresolved inputs in `OPEN_ITEMS.md` and remove them only after confirmation.

## ADR-005 — Add glyph fallback for the selected brand typefaces

- Status: Accepted by owner
- Date: 2026-10-09
- Decision: Keep Bodoni Moda for editorial text and use Noto Serif only when a glyph is missing; DM Sans remains the interface face, with the same fallback available for unsupported characters.
- Context: The upstream variable files for Bodoni Moda and DM Sans do not include the required Yoruba characters and Naira sign in their Latin subsets.
- Consequences: Self-host an extended Noto Serif subset under its OFL license. The ordinary Latin text continues to use the selected brand fonts.

## ADR-006 — Keep label identifiers shared and controlled

- Status: Accepted
- Date: 2026-10-10
- Decision: Use the seven canonical label slugs from `@lopaworld/types`; assign products through Medusa product metadata and validate required catalog data when a product is published. Use Medusa's editable product-category records instead of hard-coded category enums.
- Context: The website has seven fixed label destinations, while the product categories and label positioning still need owner approval.
- Consequences: Labels are controlled values across the CMS and commerce API. Category names and assignments remain editable business data. Incomplete draft products may be saved but cannot transition to published status.

## ADR-007 — Keep editorial data and commerce data separate

- Status: Accepted
- Date: 2026-10-10
- Decision: Payload owns editorial collections, media rights markers, homepage blocks and draft previews. CMS product references contain only Medusa handles or IDs.
- Context: Prices, variants and stock must have one source of truth in Medusa, while editors need reorderable homepage content and a safe draft preview.
- Consequences: Payload preview requires a server-side `PREVIEW_SECRET`; media does not become a product price or inventory source. Production media storage and automated seed import remain future work.

## ADR-008 — Keep checkout totals and payment verification in Medusa

- Status: Accepted for Phase 4 implementation
- Date: 2026-10-10
- Decision: Storefront checkout saves customer and Nigerian delivery address data to the Medusa cart, obtains delivery options from Medusa, and starts Paystack through a custom Medusa payment provider. The provider initializes only when server-side credentials, a callback URL and an approved channel list are configured; it verifies the transaction against the stored reference, NGN amount and payment session before authorization. The storefront return page asks Medusa to complete the cart and never trusts redirect parameters as payment proof.
- Context: Checkout requires a single source of truth for product totals, shipping amounts, order creation and payment state. The owner has not yet confirmed a Paystack account, courier, delivery table or customer policies.
- Consequences: NGN is the only supported checkout currency. Payment and delivery remain unavailable without configuration. Test-mode sign-off, webhook verification, transactional emails, shipment integrations and guest order tracking remain open work.

## ADR-009 — Limit guest order lookup to verified status

- Status: Accepted for Phase 5 foundation
- Date: 2026-10-10
- Decision: Guest tracking requires the order number and checkout email together. The public lookup returns only order, payment and fulfilment statuses and never exposes customer addresses or order contents. The first wishlist stores product references only in the current browser.
- Context: Guest tracking is in the master brief, while the owner has not confirmed a wider identity-check method, tracking provider or account policy.
- Consequences: The account portal, saved addresses, server-synced wishlist, courier status and notifications remain follow-up work; do not treat an order's fulfilment status as courier tracking.

## ADR-010 — Keep SEO origins and analytics opt-in

- Status: Accepted for Phase 6 foundation
- Date: 2026-10-10
- Decision: Generate absolute canonical, sitemap, structured-data and feed URLs only from `NEXT_PUBLIC_SITE_URL`. Load GA4 only after an explicit analytics opt-in and only when a measurement ID is configured. Keep legacy redirects in a reviewed JSON map.
- Context: The production domain, analytics/ad accounts, privacy wording and old URL export have not been supplied.
- Consequences: SEO artifacts can be locally inspected, but production canonicals/sitemap and feed links stay inactive without the domain. Meta CAPI and merchant feed submission require owner configuration and review.

## ADR-011 — Require a configured staging release before production cutover

- Status: Accepted for Phase 8 preparation
- Date: 2026-10-10
- Decision: Keep production deployment and DNS cutover pending until the owner selects/provisions the production and staging targets, configures secrets and integrations, and records staging acceptance. Require an approved rollback target and explicit approval for a real payment test order.
- Context: The repository contains local development services and CI checks, but no production host, domain, deployment workflow, payment onboarding or production secret manager is configured.
- Consequences: Phase 8 launch steps are documented in `LAUNCH-PLAN.md`; deployment, DNS changes, real charges and refunds must be completed in the configured environment with the owner.

## ADR-012 — Respect pnpm's release-age gate; patch pinned transitive vulnerabilities with scoped overrides

- Status: Accepted (engineering)
- Date: 2026-11-05
- Decision: Never install a version that pnpm's `minimumReleaseAge` rejects by adding `minimumReleaseAgeExclude` entries. When the newest release is too young, use the newest release that passes the gate, provided it contains the security fix. When an upstream package pins a vulnerable transitive dependency exactly, apply a `pnpm-workspace.yaml` `overrides` entry scoped to that parent (`parent>child`), only for a patch or minor bump. Record each override with the evidence and remove it once the parent ships the fix.
- Context: During task 0.6, `pnpm add payload@^3.93.0` silently wrote release-age exclusions for eight Payload packages published the previous day. 3.92.1 carries the same `undici` fix. `monaco-editor@0.57.0` (Payload admin) pins `dompurify@3.4.15` exactly, which has a critical advisory fixed in 3.4.17.
- Consequences: Payload is at 3.92.1 rather than npm `latest` 3.93.0 until 3.93.x passes the gate. Major-version fixes inside upstream frameworks (`happy-dom` 21, `@graphql-tools/utils` 12) are not forced through overrides; they are recorded in `docs/evidence/phase-0.md` and re-checked on each framework upgrade.

## ADR-013 — Dependency audit gate with an expiring allow-list

- Status: Accepted by the owner in conversation on 2026-11-05 ("Go ahead"), expiry 2026-12-05
- Date: 2026-11-05
- Decision: CI fails on any high or critical `pnpm audit --prod` advisory unless it is listed in `security/audit-allowlist.json` with its dependency path, reason, plan and an expiry date; an expired entry also fails CI. `scripts/audit-gate.mjs` enforces this (`pnpm audit:gate`). The seven current findings are listed with expiry **2026-12-05** (30 days).
- Context: Brief 0.11 requires CI to fail on high/critical findings. After 0.6, seven high findings remain that cannot be fixed safely inside Phase 0. Two are in Payload's rich-text stack (`happy-dom`; the fix is a major version, or a 20.x release that does not exist yet). Five are pinned inside Medusa 2.21.2 (`zod`, `tmp`: fixed by Medusa 2.22.2; `lodash`, `@graphql-tools/utils` ×2: still pinned in 2.22.2 via `@graphql-codegen/core@^4`). A plain gate would keep CI permanently red; ignoring them silently would hide the risk.
- Options considered: (a) plain gate, CI red until upstream fixes (blocks every PR); (b) `pnpm audit --ignore` / `auditConfig.ignoreGhsas` (no expiry, easy to forget); (c) **expiring allow-list (chosen)**; (d) forcing major-version overrides (`happy-dom` 21, `@graphql-tools/utils` 12) inside Payload and Medusa (risk of runtime breakage that tests do not cover).
- Consequences: CI turns red on 2026-12-05 unless each entry is fixed or deliberately renewed. Upgrading Medusa to 2.22.2 should remove the `zod` and `tmp` entries. The gate prints a warning when an entry is no longer reported, so it can be removed.

## ADR-014 — Fix the `campaigns.status` enum collision (schema change, needs owner approval)

- Status: **Proposed — awaiting owner decision** (design brief §10 stop condition: needs a Payload schema migration)
- Date: 2026-11-06
- Problem (observed): `Campaigns` has its own select field `status` (`draft`, `scheduled`, `active`, `ended`) and also uses Payload drafts, which add `_status` (`draft`, `published`). Payload names enums `enum_<collection>_<field>`, so both become `enum_campaigns_status`. The baseline migration `20261105_144453_initial_schema` created that type as `('draft', 'published')` and uses it for both `campaigns.status` and `campaigns._status` (and likewise `enum__campaigns_v_version_status` for the versions table). On the dev database, `select … where status = 'active'` fails with `invalid input value for enum payload.enum_campaigns_status: "active"`. **Editors cannot save a campaign as scheduled, active or ended.** Found while building the label Lookbook (§5.3), which needs `status = active`. No other collection has a drafts + `status` field combination.
- Interim (done): the label page filters campaigns by `status` in code instead of SQL, so no query errors. Lookbook stays hidden because no campaign can be `active` yet.
- Options:
  1. **Recommended — give the field its own enum name.** Add `enumName: 'enum_campaigns_campaign_status'` (and the versions equivalent) to the `status` select. A new reviewed migration then (a) creates the new enum types with all four values, and (b) alters `campaigns.status` and `_campaigns_v.version_status` to the new types (`USING status::text::<new type>`; only `draft` can exist today, so the cast is lossless). The drafts `_status` columns keep the existing types. Field name, API shape and admin UI are unchanged. Backward compatible: an older image still reads and writes `draft`.
  2. Rename the field (for example `campaignStatus`) with expand → migrate → contract: add a column, copy, switch code, drop later. More churn and an API change for no extra benefit.
  3. Drop the custom `status` field and rely on drafts plus `startsAt`/`endsAt` for scheduling. Changes the editorial model, so it is an owner content decision.
- Consequence of waiting: the Lookbook toggle (§5.3) never appears. The rest of Phase 2 is unaffected.

## ADR-015 — How the §7 LCP budget is measured, and whether to inline CSS (needs owner decision)

- Status: **Proposed — awaiting owner decision** (design brief §10 stop condition: a §7 budget is not met as shipped)
- Date: 2026-11-06
- Measured (production standalone build, fictional 16-product mock catalogue, Lighthouse 12.8.2 mobile = Moto G Power, slow 4G, median of 3; evidence in `docs/evidence/phase-2.md` §7):

  | Build | Throttling | `/` | `/l/trybe` | `/shop` | `/p/test-agbada` |
  |---|---|---|---|---|---|
  | Before (external CSS, consent prompt after hydration) | simulated (Lighthouse default) | 96 · LCP 2.56 s | 94 · 3.02 s | 94 · 3.01 s | 91 · 3.16 s |
  | **Committed** (external CSS, server-rendered prompt) | simulated | 96 · 2.57 s | 96 · 2.56 s | 96 · 2.57 s | 95 · 2.64 s |
  | **Committed** | applied (`devtools`) | 94 · 2.21 s | 94 · 2.20 s | 93 · 2.37 s | 92 · 2.31 s |
  | E3: prompt suppressed, `font-display: optional` (not kept) | applied | 93 · 2.32 s | 92 · 2.30 s | 92 · 2.48 s | 91 · 2.36 s |
  | **E5: inline CSS + server-rendered consent prompt** | **applied** | **98 · 1.51 s** | **96 · 1.51 s** | **97 · 1.63 s** | **96 · 1.58 s** |
  | E5 | simulated | 95 · 2.72 s | 95 · 2.71 s | 96 · 2.72 s | 94 · 2.83 s |

  CLS is 0.000–0.004 everywhere. TBT is 100–146 ms simulated, 203–255 ms applied (4× CPU on a shared container; noisy). JS first-load: 146.3 / 146.6 / 146.6 / 149.7 KB gzip, under the 150 KB budget but with 0.3 KB headroom on the PDP.
- Why: LCP equals first paint on every page (the display headline, or the first product image on `/shop`). With external CSS, first paint needs a third round trip for the 13.5 KB stylesheet, which also shares the slow link with the two preloaded fonts (140 KB) and the scripts. Inlining removes that round trip. The PDP was also held back by the analytics consent prompt, which painted only after hydration; it is now in the server HTML (kept: no trade-off, returning visitors never see it).
- Simulated LCP barely moves (2.7–2.8 s) whatever changes: Lighthouse's model charges the fonts and scripts that finish before the unthrottled LCP to the LCP. Getting simulated LCP ≤ 2.0 s would mean cutting the React/Next runtime (~115 KB gzip, fixed) or not preloading Archivo, which drops the display face on first paint (a signature element).
- Options:
  1. **Recommended — inline CSS and measure LCP with applied throttling.** Set `experimental.inlineCss: true` in `apps/storefront/next.config.ts`; `pnpm test:lhci` runs Lighthouse CI with `throttlingMethod: 'devtools'`, asserting performance ≥ 90, LCP ≤ 2.0 s and CLS ≤ 0.05, and TBT ≤ 200 ms on the simulated run (applied CPU throttling in CI is too noisy to gate on). Cost: HTML grows from ~9 KB to ~32 KB gzip per page (CSS is not cached separately and is duplicated in the RSC payload); the flag is experimental in Next 16.4.5. Returning visitors lose the cached stylesheet.
  2. Keep external CSS and treat the budget as missed until Phase 1 (`next/image`, real media) changes the picture. LCP stays 2.20–2.37 s applied, 2.56–2.64 s simulated.
  3. Keep the simulated method as the gate and relax LCP to ≤ 3.0 s (or accept the miss). No code change.
- Follow-up in any case: split `@lopaworld/ui` into per-component modules. It is one `'use client'` file, so every page ships the whole library (9.2 KB gzip), which is most of the PDP's JS headroom.
