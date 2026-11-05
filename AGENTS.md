# Repository instructions for coding agents

Before making changes, read [the engineering handoff](docs/ENGINEERING-HANDOFF.md), then read the relevant package instructions and the specific runbook or design decision for the work. `apps/storefront/AGENTS.md` contains Next.js-generated guidance; preserve that block and read the installed Next.js documentation under `node_modules/next/dist/docs/` before changing Next.js behavior.

## Product and data rules

- Do not invent Lopaworld business facts. Prices, products, stock, label positioning, delivery coverage or charges, dispatch times, returns, legal terms, customer-service contacts, payment channels, analytics accounts, and media rights require owner-approved source data. Track unresolved inputs in `docs/OPEN_ITEMS.md`.
- Medusa is the source of truth for products, variants, prices, inventory, carts, shipping methods, payments, and orders. Payload owns editorial content, media metadata, and homepage composition. Reference Medusa entities by ID or handle; do not copy prices or stock into Payload.
- Keep the seven controlled label slugs in `packages/types/src/index.ts` consistent across the storefront, Payload, and Medusa validation.
- Keep secrets in environment/secret managers. Never commit or print `.env`, production credentials, private API keys, or customer data. `.env.example` contains local placeholders, not deployable values.
- The Instagram media is a local visual reference set. Its manifest says production usage rights have not been independently verified. Do not present it as cleared production media.

## Engineering and operations rules

- Preserve `pnpm-lock.yaml` and workspace package boundaries. Use the pinned Node and pnpm versions unless a documented compatibility fix requires changing them; update `.node-version`, Dockerfiles, and CI together when changing the Node runtime.
- Payload production schema changes must be represented by reviewed migrations under `apps/storefront/src/migrations`. Generate with `pnpm payload migrate:create <name>` (no database connection needed), never against production. The baseline `initial_schema` migration exists; production applies migrations through `prodMigrations` on connect.
- Keep PostgreSQL and Redis private in deployed Compose. Do not add public ports for them.
- Do not deploy, change DNS, use live payment credentials, perform real charges/refunds, restore or delete production data, or remove persistent volumes without direct owner authorization and a verified runbook.
- Update `docs/ENGINEERING-HANDOFF.md` and the relevant focused document when architecture, operations, deployment, open owner inputs, or release status changes. Keep the handoff factual and label observed behavior separately from assumptions.

## Commands

Use the repository scripts documented in `docs/RUNBOOK.md`. The main commands are `pnpm dev`, `pnpm dev:storefront`, `pnpm dev:medusa`, `pnpm typecheck`, `pnpm lint`, `pnpm tokens:check`, `pnpm test:e2e`, and `pnpm build`. Run checks appropriate to the user's request and report failures with their actual environment and cause; do not claim a check passed if it was not run.
