# Local development runbook

## Requirements

- Node.js `24.15.0` (Medusa v2.19+ requires Node.js 20.19+ or 22.12+; Node 24 satisfies that requirement).
- pnpm `11.19.0`.
- Docker Desktop with Compose.

## First run

1. Copy `.env.example` to `.env` and replace all `replace-*` values with unique random secrets. Never commit `.env`.
2. Start local dependencies: `pnpm infra:up`.
3. Install workspace dependencies: `pnpm install`.
4. Start both apps: `pnpm dev`.
5. Open the storefront at `http://localhost:3000`, Payload at `/admin`, and Medusa admin at `http://localhost:9000/app`.

The first Medusa boot performs its application initialization/migrations. Create an admin user using the Medusa CLI (`pnpm --filter @lopaworld/medusa exec medusa user -e <email> -p <password>`). Payload prompts you to create its first admin user at `/admin`.

## Useful commands

- `pnpm dev:storefront` and `pnpm dev:medusa` run one application independently.
- `pnpm infra:logs` tails local dependency logs.
- `pnpm infra:down` stops the dependency containers. Named volumes retain local data.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` run workspace quality checks.

## Environment and secrets

`.env.example` documents required local settings. In CI and hosted environments, store each secret in the platform secret manager. Do not use placeholder secrets in deployed environments. Public publishable keys may be exposed only after they are provisioned and scoped correctly; private API keys must remain server-side.

## Payments

Payment processing is not implemented in Phase 0. Paystack test-mode setup and webhook verification will be documented in Phase 4. A browser success redirect is never authoritative proof of payment.

## Backups and recovery

Local volumes can be removed with `docker compose down -v` (this permanently deletes local database, Redis and MinIO data). Production RTO/RPO, daily database backup and restore steps, and object versioning are `TODO_CONFIRM:` until hosting is selected. Do not treat local volumes as backups.

## Operations

Sentry, uptime checks, structured logging, alerting and deployment procedures are not configured yet. Add provider-specific commands and recovery steps when infrastructure is selected.
