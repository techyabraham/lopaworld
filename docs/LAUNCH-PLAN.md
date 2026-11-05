# Phase 8 — launch and aftercare plan

## Current launch state

**Status: production deployment not yet configured.** The repository now includes application Dockerfiles, a Coolify Docker Compose definition, a Contabo/Coolify guide, local Docker Compose services, and a quality workflow. These files have not been proven in a clean Linux build or deployed to a VPS. No production host, Coolify project, staging environment, DNS target, production secrets, or release/rollback target is configured. CI runs on pull requests and pushes to `main`/`master`; it can also be started manually. A green hosted run is still required before release.

The code expects `NEXT_PUBLIC_SITE_URL` for canonical URLs, sitemap, structured data and feeds. It is not set in `.env.example`. Production commerce also needs managed PostgreSQL and Redis, working media storage/CDN, separate Medusa server and worker processes, approved shipping configuration, payment onboarding and test sign-off, transactional email, monitoring and backup/restore. See `docs/OPEN_ITEMS.md` for owner inputs. Do not deploy with example credentials or demo seed data.

## Cutover sequence

1. Select and provision the Node.js/Docker hosting target for the storefront/Payload and separate Medusa server and worker processes. Provision managed PostgreSQL, Redis and Cloudflare R2/CDN; configure TLS, secret storage, backups, monitoring and staging.
2. Set environment-specific secrets and public origins in the platform secret manager. Confirm the production build and health endpoints on staging. Run the Phase 7 QA checklist and record evidence.
3. Apply database migrations using the platform's release process. Deploy the storefront, Medusa server and worker to staging. Confirm health, CMS admin access, catalogue reads, cart creation, shipping options, payment webhook reachability, email delivery and logs.
4. Configure the production domain and TLS before changing DNS. Lower DNS TTL in advance if the registrar/provider supports it. Capture current DNS records and verify the rollback target and responsible operator.
5. Deploy the production release with current DNS unchanged. Run read-only smoke checks against the production origin and verify security headers, robots/sitemap/canonicals, redirects, content, media, monitoring and uptime alerts.
6. Obtain explicit business approval for a real low-value order and its maximum charge. Execute one order using the approved production payment channel; verify Paystack server-side payment status, Medusa order creation, customer/staff email, inventory decrement and guest tracking. Refund it through the approved process and reconcile the provider and admin records.
7. Cut DNS over to the verified production target. Re-run smoke checks and watch errors, checkout conversion, webhook processing, queue backlog and uptime. Keep the old target available until the rollback window is closed.
8. If critical checks fail, point DNS back to the captured previous target, roll application services back to the last known-good release, and restore the database only under the approved recovery procedure. Reconcile payments and orders created during the cutover before retrying.

DNS changes, production payment attempts, refunds and database restoration require production access and the responsible owner; this plan does not perform those actions.

## Launch smoke checks

- [ ] Storefront, Payload admin, Medusa API and worker health checks are green and monitored.
- [ ] Seven label routes, product detail, search, bag, checkout and order tracking respond correctly on mobile and desktop.
- [ ] Production canonicals, sitemap, robots, structured data, redirect map and social metadata use the approved domain.
- [ ] CSP and security headers match deployed integrations; no placeholder secrets, demo content or unapproved public claims are present.
- [ ] Shipping options, final cart totals and customer policies match owner-approved rules.
- [ ] Approved low-value order is server-verified, sent to Medusa once, emailed, trackable, then refunded/reconciled.
- [ ] Backup restore, monitoring, alert routing, rollback and incident contacts are verified.
- [ ] 360 px mobile path and desktop smoke path pass; staging evidence is attached to the release record.

## First 30 days after launch

| Period | Review and action |
| --- | --- |
| Days 1–3 | Daily review of uptime, 5xx responses, payment failures, webhook delays, queue backlog, checkout completion and support contacts. Triage launch-blocking defects first. |
| Days 4–7 | Review search and zero-result terms, product exits, filter usage, checkout abandonment and mobile performance. Confirm analytics consent behavior and exclude staff/test traffic. |
| Week 2 | Prioritize the largest observed discovery and conversion friction; verify fixes on a representative mobile device and rerun affected accessibility/performance checks. |
| Week 3 | Review catalogue completeness, stock accuracy, delivery exceptions, returns questions and support response times with operations. Update content only from approved policy decisions. |
| Week 4 | Compare Core Web Vitals and funnel behavior with launch baseline, review incidents and costs, publish a ranked backlog with owner, impact and effort, and agree the next monthly review. |

Track issues with evidence and owners. Do not infer policy changes or alter live prices, delivery claims or payment settings from analytics alone.

## Phase 8 acceptance

- [ ] Production deployment configured and verified — **Fail / pending hosting and domain details**.
- [ ] DNS cutover and rollback rehearsed — **Fail / pending production environment**.
- [ ] Real low-value order approved, verified, emailed, tracked and refunded/reconciled — **Fail / pending payment onboarding and explicit charge approval**.
- [ ] Monitoring dashboards and alerts live — **Fail / pending monitoring provider**.
- [ ] 30-day backlog defined — **Pass / prepared above; populate with live observations after launch**.

## TODO_CONFIRM items

- Production host/provider and region; staging and production URLs; DNS owner/access; TLS and rollback target.
- Managed PostgreSQL and Redis services, Cloudflare R2 bucket/CDN configuration, database migration and recovery procedure.
- Production secret provisioning and approved domains/origins; email sender and monitoring/uptime services.
- Product catalogue, logo/media rights, delivery/returns/privacy/legal content, customer support contacts and final redirects.
- Paystack live account, merchant entity, channels, callback/webhook URLs, settlement and refund owner; explicit approval and maximum amount for a real test order.
- Final CSP review, shared rate limiting, accessibility/performance/load and backup/restore sign-off from Phase 7.
