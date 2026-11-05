# Local development runbook

## Requirements

- Node.js `24.15.0` (Medusa v2.19+ requires Node.js 20.19+ or 22.12+; Node 24 satisfies that requirement).
- pnpm `11.19.0`.
- Docker Desktop with Compose.

## First run

1. Copy `.env.example` to `.env` and replace all `replace-*` values with unique random secrets, including `PREVIEW_SECRET`. Never commit `.env`.
2. Start local dependencies: `pnpm infra:up`.
3. Install workspace dependencies: `pnpm install`.
4. Start both apps: `pnpm dev`.
5. Open the storefront at `http://localhost:3000`, Payload at `/admin`, and Medusa admin at `http://localhost:9000/app`.

SEO and feed routes are `/sitemap.xml`, `/robots.txt`, `/feeds/google.xml` and `/feeds/meta.xml`. Set `NEXT_PUBLIC_SITE_URL` to the verified HTTPS site origin before publishing sitemap/canonical links or submitting feeds. GA4 remains unloaded until a measurement ID is configured and the visitor opts in. Use actual test catalog data when validating feeds; incomplete variants are omitted.

The first Medusa boot performs its application initialization/migrations. Create an admin user using the Medusa CLI (`pnpm --filter @lopaworld/medusa exec medusa user -e <email> -p <password>`). Payload prompts you to create its first admin user at `/admin`.

## Useful commands

- `pnpm dev:storefront` and `pnpm dev:medusa` run one application independently.
- `pnpm infra:logs` tails local dependency logs.
- `pnpm infra:down` stops the dependency containers. Named volumes retain local data.
- If another PostgreSQL already listens on 5432 (on the original workstation, a native Windows PostgreSQL 18 service does), set `POSTGRES_HOST_PORT=5434` in `.env` and use port 5434 in `DATABASE_URL`. Otherwise `pnpm infra:up` cannot bind the port, and connections reach the other server (the source of the earlier `28P01` errors).
- `pnpm db:verify:up` starts a disposable, empty PostgreSQL 17 on `127.0.0.1:5433` (Compose project `lopaworld-verify`, tmpfs, no volume) for proving migrations; `pnpm db:verify:down` discards it. Example: `DATABASE_URL=postgres://verify:verify@127.0.0.1:5433/lopaworld_verify pnpm payload migrate`.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` run workspace quality checks.
- `pnpm test` runs the Vitest unit tests (storefront: `apps/storefront/src/**/*.test.ts`).
- `pnpm tokens:check` verifies all seven provisional accent themes against the WCAG AA contrast threshold.
- `pnpm test:e2e` runs Playwright and axe checks for `/dev/type` and `/dev/ui`; the galleries return 404 in production.
- `python packages/ui/scripts/check-font-glyphs.py` verifies the variable font axes and that Noto Serif covers sample glyphs missing from Bodoni Moda and DM Sans.
- `seed/demo-labels.json` contains synthetic local-only label records. The application never imports these automatically; do not use the file in production.
- Payload owns editorial collections and the reorderable Homepage Layout global. Its Preview button opens `/preview/homepage` using a draft-mode cookie created by the secret-protected `/api/preview/homepage` route.

## Environment and secrets

`.env.example` documents required local settings. In CI and hosted environments, store each secret in the platform secret manager. Do not use placeholder secrets in deployed environments. Public publishable keys may be exposed only after they are provisioned and scoped correctly; private API keys must remain server-side.

## Payments

The custom Paystack provider is registered only when `PAYSTACK_SECRET_KEY`, `PAYSTACK_CALLBACK_URL`, and an owner-approved comma-separated `PAYSTACK_CHANNELS` list are configured. Leave the example values in place until the Lopaworld account, enabled channels, legal merchant entity and settlement arrangements are confirmed. The provider accepts NGN only; no USD or pay-on-delivery path is enabled.

When those owner inputs are ready:

1. Use Paystack's test secret key and approved test channels in a non-production `.env`; never use a live key for checkout development.
2. Set `PAYSTACK_CALLBACK_URL` to the reachable HTTPS storefront return page for the environment. Configure Paystack's webhook URL as `https://<medusa-host>/hooks/payment/paystack_paystack` for provider identifier `paystack` and provider ID `paystack`, then verify it is reachable from Paystack before testing.
3. Create a test cart with valid NGN products, an approved Nigerian delivery address, and a configured Medusa shipping option. Verify the payment initialization amount is the Medusa cart total in minor units.
4. Test successful, declined, cancelled, abandoned and delayed transactions. Confirm the storefront only displays an order after Medusa server-side verification; the browser return URL and query parameters are never proof of payment.
5. Deliver the same signed webhook more than once and replay a webhook with an altered body/signature. Verify duplicate events do not duplicate orders and invalid signatures are rejected.
6. Test a transaction whose verified amount, currency or reference differs from the stored payment session. It must not authorize or create an order.
7. Exercise full and partial refunds through the Medusa order/payment workflow and verify the provider result and admin record.

Do not advertise delivery fees, delivery windows, returns or refunds until the owner-approved rules are loaded. Guest lookup requires the order number and checkout email; courier shipment creation and carrier status tracking still require a real provider.

## Backups and recovery

Local volumes can be removed with `docker compose down -v` (this permanently deletes local database, Redis and MinIO data). Production RTO/RPO, daily database backup and restore steps, and object versioning are `TODO_CONFIRM:` until hosting is selected. Do not treat local volumes as backups.

## Phase 7 QA and security

Use `docs/PHASE-7-QA-CHECKLIST.md` for launch verification. The storefront sets baseline CSP and browser security headers, and cart/checkout state-changing routes reject requests that do not match the storefront origin. The CSP retains inline script/style allowances for the current Next.js and Payload setup; review it against actual production integrations before launch.

Public order lookup has no shared rate limiter yet. Add one backed by the production Redis/service before exposing it to meaningful traffic. Run accessibility, Lighthouse, browser E2E, load, dependency-scan and backup/restore checks in staging; source review and local type/lint checks do not replace those deployment checks.

## Phase 8 launch and aftercare

See `docs/LAUNCH-PLAN.md` for staged deployment, DNS cutover, smoke-test, rollback and first-30-day review steps. No production provider, DNS target, staging environment, or deployment workflow is configured in this repository. Do not point DNS or use live payment credentials until owner inputs are confirmed and staging acceptance is recorded. A real low-value order/refund requires explicit owner approval and an agreed maximum charge.

## Operations

Sentry, uptime checks, structured logging, alerting and deployment procedures are not configured yet. Add provider-specific commands and recovery steps when infrastructure is selected.

## Production images

- `docker/medusa.Dockerfile` builds the Medusa image: workspace packages → `medusa build` → `pnpm deploy --prod --legacy /app` → packed `@lopaworld/*` swapped in → `.medusa/server` overlaid. The build fails if a workspace package would load TypeScript at runtime or if any link points outside `/app`.
- `.github/workflows/images.yml` builds it on clean Linux on every push to `phase/**` and on PRs, then boots it against fresh Postgres 17 and Redis 7 and checks `/health`, `/app` and migrations. Measurements appear as notice annotations on the run; failures publish the build or container log tail as an error annotation.
- New Medusa admin or plugin dependencies may need declaring in `apps/medusa/package.json` (dev dependencies) because pnpm's strict layout does not expose undeclared or optional peer packages to the admin build.
- `docker/storefront.Dockerfile` builds the storefront from Next's standalone output (`output: 'standalone'`, traced from the repo root) and runs `node server.js` in `/app/apps/storefront`. `public/` and `.next/static` are copied beside it. Pass `NEXT_PUBLIC_*` values as build args; they are baked into the client bundle. Never give the build a reachable `DATABASE_URL`: `next build` runs with `NODE_ENV=production`, so Payload would apply migrations during the build.
- To test a standalone build locally: build, copy `public` and `.next/static` into `.next/standalone/apps/storefront/`, then run `node server.js` there with `NODE_ENV=production` and a `DATABASE_URL` (e.g. the `db:verify` instance).
- Keep the database used by `pnpm dev` (where Payload pushes schema changes directly) separate from any database that receives migrations (`pnpm payload migrate`, `prodMigrations`, `next build` against a reachable database). Payload detects a dev-pushed database and stops migrations at an interactive data-loss prompt; in CI that hangs the build. CI gives the dev-server tests their own database (`ci_dev`).
