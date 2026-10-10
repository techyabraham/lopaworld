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
