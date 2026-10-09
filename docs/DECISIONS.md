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
