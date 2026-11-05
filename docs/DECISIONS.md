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
