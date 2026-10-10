# Lopaworld architecture

## Phase 0 foundation

```mermaid
flowchart LR
  Browser --> Storefront[Next.js App Router + Payload CMS]
  Storefront -->|catalogue, cart and orders| Medusa[Medusa v2 API]
  Storefront -->|editorial reads and writes| Payload
  Payload[Payload CMS] --> PostgreSQL[(PostgreSQL)]
  Medusa --> PostgreSQL
  Medusa --> Redis[(Redis)]
  Medusa -. later: media module .-> R2[Cloudflare R2 / CDN]
  LocalDev[Local development] -. S3-compatible .-> MinIO[MinIO]
```

The storefront and Payload admin/API run in `apps/storefront`; Medusa server and its worker run together in shared worker mode during local development (`apps/medusa`). PostgreSQL is shared as a server but uses the isolated `payload` schema for CMS tables. Redis backs Medusa sessions and can be used by its event, workflow and locking modules when configured. Production will run Medusa server and worker as separate processes.

No application has been wired to R2 yet. MinIO is provided for local S3-compatible development; production media storage configuration is a later phase.

## Data ownership

- Medusa owns products, variants, prices, inventory, carts, promotions, orders and regions.
- Medusa product labels use the controlled seven-slug set in `@lopaworld/types`; the assignment is stored as product metadata and validated when a product is published. Categories remain editable Medusa product categories.
- Published Medusa products require a valid label, images with alternative text, at least one complete option/variant, and a positive NGN price for every variant. Draft products can be incomplete while being edited.
- Payload owns labels' editorial pages, campaigns, stories, size guides, content pages and homepage composition. Payload references commerce entities by Medusa handle or ID. It must never copy prices or stock.
- Payload homepage content is an ordered `blocks` field and has a draft preview route. Uploaded media is marked with rights confirmation before it can be selected for campaign or label hero fields.
- Secrets are read from environment variables and are not included in client bundles.

Phase 2 configuration lives in `apps/storefront/src/collections`, `apps/storefront/src/globals` and `apps/medusa/src/utils/product-validation.ts`. Synthetic seven-label examples live only in `seed/demo-labels.json`; they are never auto-imported and are not approved Lopaworld copy.

## Shared design system (Phase 1)

Design tokens live in `packages/ui/tokens/tokens.css`; components and their accessible interaction patterns live in `packages/ui`. Tailwind v4 reads aliases for the central CSS variables in the storefront's `globals.css`. All seven label themes use the same provisional accent-token structure; actual brand colours remain `TODO_CONFIRM:`. Bodoni Moda and DM Sans are self-hosted variable fonts, with Noto Serif used only when a required glyph is unavailable in the primary face.

## Local service endpoints

| Service | Endpoint |
| --- | --- |
| Storefront and Payload admin | `http://localhost:3000` and `/admin` |
| Medusa API and admin | `http://localhost:9000` and `/app` |
| MinIO S3 API / console | `http://localhost:9002` / `http://localhost:9003` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

## Decision log

See [DECISIONS.md](DECISIONS.md). Update the architecture diagram and this page when service boundaries or data ownership change.
