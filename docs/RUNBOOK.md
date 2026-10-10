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
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` run workspace quality checks.
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

## Operations

Sentry, uptime checks, structured logging, alerting and deployment procedures are not configured yet. Add provider-specific commands and recovery steps when infrastructure is selected.
