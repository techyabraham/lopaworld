# Deploy Lopaworld to Contabo with Coolify

This guide deploys the Git repository as one Coolify Docker Compose application. The stack contains the storefront/Payload CMS, Medusa, PostgreSQL and Redis. Coolify's proxy handles public HTTPS routing; database and Redis ports are not published to the internet.

## Current deployment readiness

The repository now has production Dockerfiles and a separate `coolify.compose.yaml`. Before treating the site as a production shop:

- Resolve the Next.js security upgrade block before release. The current local production build resolves Next.js 16.4.0 and stops after compilation with a security-fatal upgrade recommendation.
- Verify a clean Linux image build in Coolify. The Medusa build on this Windows workspace currently stops in the installed dependency tree with `Cannot find module './maps.js'` from `emittery`; this may be a local install issue and is not yet verified on Linux.
- Commit a Payload Postgres baseline migration under `apps/storefront/src/migrations`. Payload's local development push mode does not create the production schema automatically. The container runs `payload migrate` at startup, so the migrations must be in Git before the first deployment.
- Supply a valid `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` after the first Medusa deployment, then rebuild/redeploy the storefront.
- Add the approved catalogue, fulfilment/shipping rules, payment configuration, privacy/legal content and customer support details listed in `OPEN_ITEMS.md`.
- Confirm permission to publish all imported social images. They are currently marked as not independently rights-cleared in `apps/storefront/public/media/instagram/manifest.json`.
- Configure an external, tested backup destination for PostgreSQL and media. Docker volumes on a single VPS provide persistence, not disaster recovery.

## 1. Create the Contabo VPS

Use a fresh 64-bit Ubuntu LTS server. Coolify's documented minimum is 2 CPU cores, 2 GB RAM and 10 GB free disk, but that minimum is only for Coolify itself. For Coolify, PostgreSQL, Redis, Next.js and Medusa together, budget at least 4 vCPU, 8 GB RAM and 100 GB SSD; this is a workload estimate, not a Coolify minimum. A larger plan gives more headroom for image builds and database growth.

In the Contabo firewall, allow inbound TCP 22 from your own IP and TCP 80/443 publicly. During initial Coolify setup, also allow TCP 8000, 6001 and 6002; restrict these to your IP if possible. Do not open PostgreSQL 5432 or Redis 6379. If you use UFW, allow SSH before enabling it so you do not lock yourself out.

Create DNS records pointing to the VPS IPv4 address:

| Type | Name | Target |
| --- | --- | --- |
| A | `@` or your chosen storefront host | VPS IPv4 |
| A | `www` | VPS IPv4 |
| A | `api` | VPS IPv4 |
| A | `coolify` | VPS IPv4 |

Use `www.example.com` as the storefront, `api.example.com` for Medusa API/admin, and `coolify.example.com` for the Coolify dashboard. Replace `example.com` with your domain. Add AAAA records only if IPv6 is configured and reachable on the VPS.

## 2. Install Coolify

Connect to the VPS using SSH. For first setup, log in with the provided account and elevate to root if required. Install updates, configure SSH key access, and then run Coolify's official installer:

```bash
apt update && apt upgrade -y
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Open `http://VPS_IPV4:8000` and create the Coolify administrator immediately. Do not leave the initial setup page exposed. In Coolify, confirm the local server validates and the proxy is running.

Set the Coolify instance domain to `https://coolify.example.com`, wait for HTTPS and the dashboard, terminal and realtime features to work through that domain, then remove public inbound access to 8000, 6001 and 6002. Keep 22, 80 and 443 open as required.

Back up Coolify's installation secrets at `/data/coolify/source/.env` outside the VPS. Coolify needs this file to recover encrypted settings.

## 3. Prepare the Git repository

Push this repository to a Git host Coolify can access. Keep `.env` out of Git. Use a private repository and a Coolify deploy key if the source is private.

The Payload baseline migration is committed under `apps/storefront/src/migrations`. It is applied in-process by `prodMigrations` when the storefront first connects with `NODE_ENV=production`; the container does not run the Payload CLI. To create a later migration, from the repository root:

```bash
pnpm payload migrate:create <name>
```

Review the generated SQL and commit all files under `apps/storefront/src/migrations`. Never point Payload at a production database from a workstation. Every schema change must be backward compatible (expand → migrate → contract) so an app rollback never needs a database restore.

## 4. Create the Coolify Compose application

In Coolify:

1. Create a Project and Production environment.
2. Select **New Resource → Public Repository** or configure a private Git source.
3. Select this repository and the deployment branch.
4. Choose the **Docker Compose** build strategy.
5. Set the base directory to `/` and Compose file to `coolify.compose.yaml`.
6. Save and let Coolify parse the stack. Do not use Raw/as-is Compose mode.
7. In Domains, route `https://www.example.com` to service `storefront`, internal port `3000`.
8. Add `https://api.example.com` to service `medusa`, internal port `9000`.
9. Keep the DNS records pointed at this VPS and ports 80/443 reachable so Coolify can issue HTTPS certificates.

The database and Redis are internal services in the same Compose network. The Compose definition intentionally has no host `ports:` mappings for them.

## 5. Add Coolify environment variables

Create fresh random values in Coolify's Environment Variables. Use 32-byte hex values for secrets and the database password, for example generate each with `openssl rand -hex 32` on a trusted machine. Do not reuse development secrets or commit production values.

| Variable | Value |
| --- | --- |
| `POSTGRES_USER` | `lopaworld` or another database role name |
| `POSTGRES_PASSWORD` | Fresh 64-character hexadecimal secret |
| `POSTGRES_DB` | `lopaworld` |
| `PAYLOAD_SECRET` | Fresh 64-character hexadecimal secret |
| `PREVIEW_SECRET` | A different fresh 64-character hexadecimal secret |
| `JWT_SECRET` | Fresh 64-character hexadecimal secret |
| `COOKIE_SECRET` | A different fresh 64-character hexadecimal secret |
| `NEXT_PUBLIC_SITE_URL` | `https://www.example.com` |
| `STORE_CORS` | `https://www.example.com` (include apex too if it serves the shop) |
| `ADMIN_CORS` | `https://api.example.com` |
| `AUTH_CORS` | Comma-separated storefront and API origins, e.g. `https://www.example.com,https://api.example.com` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Leave empty for first bootstrap; fill after creating the Medusa key in step 7 |

The stack constructs the internal `DATABASE_URL` and `REDIS_URL`. Do not set public ports for either service. Leave `PAYSTACK_SECRET_KEY`, `PAYSTACK_CALLBACK_URL` and `PAYSTACK_CHANNELS` empty until the business account, approved channels and test sign-off are ready. The callback should eventually be `https://www.example.com/checkout/return`.

The storefront URL and publishable key are build arguments as well as runtime values. Changing either requires a new image build/redeploy.

## 6. Deploy and initialize

Deploy the Compose application and inspect deployment/runtime logs. The first deployment builds both application images, starts PostgreSQL and Redis, applies Medusa migrations, applies committed Payload migrations, and starts the storefront.

If Coolify reports a build failure, inspect the service build logs for the failing Dockerfile stage. If a service does not become healthy, inspect its runtime logs. Verify the root storefront page and Payload admin at `https://www.example.com/admin` before entering content.

Create the first Payload admin user and save the Homepage Layout global with at least one block. Create/publish the label records needed by its label entrance block. The storefront has fallbacks, but published CMS content is required to manage the real homepage in Payload.

In the Medusa admin at `https://api.example.com/app`, create a publishable API key and attach it to a sales channel. Add its value to `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in Coolify and redeploy so the storefront build includes it. Then add the real catalogue, region, shipping options, tax/payment settings and product media.

## 7. Verify before launch

- Check `https://www.example.com`, all seven label pages, product pages, `/admin`, and `https://api.example.com/app`.
- Check the storefront can read the Medusa catalogue using the publishable key.
- Confirm no direct public ports expose PostgreSQL, Redis or application containers.
- Test a full checkout in Paystack test mode only after a real test account, approved channels and shipping options have been configured. Test success, decline, cancel, webhook replay and refund paths.
- Verify Payload uploaded media persists after a storefront redeploy. Verify Medusa product uploads persist after a Medusa redeploy.
- Create off-server backups of PostgreSQL and both media volumes; perform a restore rehearsal before launch.
- Review the Phase 7 manual QA checklist, production policy inputs and `OPEN_ITEMS.md` before enabling real payments or accepting customers.

## Updating the deployment

Push reviewed changes to the configured branch and deploy from Coolify. Back up persistent data before database or volume changes. Medusa database migrations run before Medusa starts; Payload applies the migrations shipped in the image at startup. Keep migration files in Git and never edit production schema manually as a substitute for migrations.

## Official references

- [Coolify self-hosted installation and requirements](https://coolify.io/docs/start-with-self-hosted)
- [Coolify Git-based Docker Compose deployment](https://coolify.io/docs/applications/builds/docker-compose)
- [Coolify firewall ports](https://coolify.io/docs/core/infrastructure/servers/firewall)
- [Contabo VPS plans](https://docs.contabo.com/docs/servers-hosting/vps/)
- [Contabo firewall rules](https://help.contabo.com/en/support/solutions/articles/103000390430-firewall-what-is-it-and-how-does-it-protect-my-vps-vds-)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Medusa production deployment](https://docs.medusajs.com/learn/deployment/general)
- [Payload production deployment](https://payloadcms.com/docs/production/deployment)
- [Payload Postgres migrations](https://payloadcms.com/docs/database/migrations)
