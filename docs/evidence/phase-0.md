# Phase 0 evidence — Stabilise

Branch `phase/0-stabilise`. Every result below was observed in the session that recorded it. Nothing here was run against a live Medusa, Payload database, Paystack or Docker engine unless stated.

## Session 1 — 5 November 2026

**Environment:** Windows 10 Pro 10.0.19045, Node 24.15.0, pnpm 11.19.0, Git Bash. Base commit `c84b084` (local `master` fast-forwarded from `2a2e274` to `origin/master`, which contained the brief).

### Baseline checks (before any change)

| Command | Result | Key output |
|---|---|---|
| `git status` | clean | No uncommitted work. `apps/storefront/next-env.d.ts` had no diff (task 0.1). `next build` later rewrote it from `.next/dev/types` to `.next/types`; the generated change was reverted, not committed. |
| `pnpm install --frozen-lockfile` | **pass** | `Already up to date` |
| `pnpm typecheck` | **pass** | types, ui, medusa, storefront: `Done` |
| `pnpm lint` | **fail** | `✖ 6 problems (2 errors, 4 warnings)`; errors are `react-hooks/set-state-in-effect` at `components/account/WishlistButton.tsx:12` and `components/site/AnalyticsConsent.tsx:29`; warnings are `@next/next/no-img-element` (audit N5, B6). |
| `pnpm build` | **fail** (medusa, first) | `Cannot find module './maps.js'` from `node_modules/.pnpm/emittery@0.13.0/node_modules/emittery/index.js`; the package directory on disk contains no `maps.js` (audit N1). |
| `pnpm --filter @lopaworld/storefront build` | **fail** | Without `.env`: `Missing required environment variable: PAYLOAD_SECRET` at `payload.config.ts:17` (audit N3). |
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` | **fail** | Compiles and lists all routes, then `Error [SecurityFatalError]: Your version of Next.js is affected by a known security vulnerability.` (Next 16.4.0; audit N2, task 0.6). |

The `SecurityFatalError` text includes instructions addressed to a coding agent (ask the user to run `next upgrade --agent=security …`). They were not acted on; the upgrade is brief task 0.6.

### 0.2 — B1 fix

**Change:** `api/checkout/complete` reads the cart cookie first and always attempts to complete that cart. The `lw_order_id` cookie is used only when no cart is awaiting completion (e.g. the return page reloaded after success) and by the confirmation page. `POST /api/checkout` and `POST /api/checkout/payment` now clear `lw_order_id` when a new checkout starts. Cookie name and the clear helper live in `apps/storefront/src/lib/order-cookie.ts`.

**Tests:** `apps/storefront/src/app/api/checkout/complete/route.test.ts`, `apps/storefront/src/app/api/checkout/order-cookie-reset.test.ts` (Vitest, Medusa and `next/headers` mocked).

| Command | Code | Result | Key output |
|---|---|---|---|
| `pnpm test` | old (B1 present) | **fail, as expected** | `Tests 4 failed \| 2 passed (6)`. Current-cart test: expected `orderId: "order_new"`, received `"order_old"`. Pending test: expected 202, received 200. Both cookie-reset tests: `lw_order_id` still present. |
| `pnpm test` | new | **pass** | `Test Files 2 passed (2)`, `Tests 6 passed (6)` |
| `pnpm typecheck` | new | **pass** | |
| `pnpm lint` | new | **fail (unchanged)** | Same `6 problems (2 errors, 4 warnings)` as baseline; no new findings. |

**Dependency added:** `vitest@5.1.0` (dev, storefront) — brief 0.11 requires Vitest for unit tests. `pnpm add` also let pnpm deduplicate about a dozen transitive lockfile entries onto versions already in the lock (e.g. `inquirer` → `ansi-escapes`, `express` → `cookie`). No new packages other than Vitest's own tree; `next`, `payload`, `react` and `@medusajs/*` resolutions are unchanged.

**Not covered:** no end-to-end run with a real Medusa cart and Paystack test payment (needs a booted stack, task 0.10–0.11).

### 0.3 — B2 fix

**Change:** `getStoreRegion` (`apps/storefront/src/lib/store.ts`) caches only a found region, for 5 minutes. A missing region or a failed request is not cached, so the next call retries. Concurrent callers share one in-flight request. If a refresh after the TTL fails, the last region Medusa returned is still served (stale-on-error), so a brief Medusa outage does not break add-to-bag for a region that was already known.

**Tests:** `apps/storefront/src/lib/store-region.test.ts` (global `fetch` stubbed, `Date` faked). `server-only` is aliased to an empty stub in `vitest.config.ts`, because Next resolves it internally and it is not installed as a package.

| Command | Code | Result | Key output |
|---|---|---|---|
| `pnpm test` | old (B2 present) | **fail, as expected** | `Tests 3 failed \| 9 passed (12)`. The unreachable and no-NGN retry tests got `null` on the second call; the TTL-refresh test got the original region after the TTL. |
| `pnpm test` | new | **pass** | `Test Files 3 passed (3)`, `Tests 12 passed (12)` |
| `pnpm typecheck` | new | **pass** | |
| `pnpm lint` | new | **fail (unchanged)** | Same `6 problems (2 errors, 4 warnings)` as baseline. |

**Not covered:** behaviour against a real Medusa process restarting (needs a booted stack).

### 0.4 — B3 fix

**Change:** new `retrieveUsableCart(fields)` in `apps/storefront/src/lib/cart.ts` reads the cart named by `lw_cart_id` and adds `+completed_at,+region_id` to the requested fields. If Medusa answers 404, the cart is completed, or its region differs from the current store region, the cookie is cleared and `null` is returned. Any other Medusa failure is rethrown and the cookie is kept, so a temporary outage does not discard a bag. `createOrReadCart` (add-to-bag), `GET /api/cart` (bag and launcher) and `GET /api/checkout` use it. `medusaFetch` now throws `MedusaStoreError` carrying the HTTP status; the message text is unchanged. The completion route deliberately does not use it, because a completed cart is meaningful there.

**Tests:** `apps/storefront/src/lib/cart.test.ts`. The global `fetch` is stubbed at the Medusa HTTP boundary, so the real `medusaFetch`, `getStoreRegion` and route handlers run.

| Command | Code | Result | Key output |
|---|---|---|---|
| `pnpm test` | old (B3 present) | **fail, as expected** | `Tests 6 failed \| 14 passed (20)`. Missing, completed and wrong-region carts: `expected 'cart_old' to be 'cart_new'`. Medusa 503: `promise resolved "'cart_old'" instead of rejecting`. `GET /api/cart`: `expected 503 to be 200`. `GET /api/checkout`: `expected 503 to be 404`. |
| `pnpm test` | new | **pass** | `Test Files 4 passed (4)`, `Tests 20 passed (20)` |
| `pnpm typecheck` | new | **pass** | |
| `pnpm lint` | new | **fail (unchanged)** | Same `6 problems (2 errors, 4 warnings)` as baseline. |

**Behaviour to note:** a cart left in a retired region is replaced, not migrated, so its items are dropped (as specified in brief 0.4). The other cart routes (`PATCH`/`DELETE /api/cart/items`, checkout `POST`, shipping, payment) still read the cookie directly. They are reached only after the bag or checkout `GET` has validated the cart.

**Not covered (B3):** that Medusa 2.21.2 really returns 404 for an unknown cart id, and that `+completed_at,+region_id` keeps the default fields, have not been checked against a running Medusa.

### 0.5 — B12 fix

**Search:** every `error.message` / `instanceof Error` use under `apps/` was reviewed. The only server route returning raw error text was `POST /api/cart/items` (`route.ts:42-44`). The client components that display `reason.message` show either the server's `error` string or the browser's own fetch/JSON error, not server internals.

**Change:** the `POST /api/cart/items` catch now always returns `Your bag could not be updated. Please try again.` (503) and records the detail with the new `logServerError(scope, error)` in `apps/storefront/src/lib/server-log.ts`. That helper writes one JSON line to `console.error` with the scope, error name and message only. Structured logging with request IDs is still task 1.9.

**Tests:** `apps/storefront/src/app/api/cart/items/route.test.ts`. With no cart cookie and no publishable key, the internal message must not reach the browser and must appear in the server log.

| Command | Code | Result | Key output |
|---|---|---|---|
| `pnpm test` | old (B12 present) | **fail, as expected** | `Tests 1 failed \| 20 passed (21)`: `expected 'Medusa publishable API key is not con…' to be 'Your bag could not be updated. Please…'` |
| `pnpm test` | new | **pass** | `Test Files 5 passed (5)`, `Tests 21 passed (21)` |
| `pnpm typecheck` | new | **pass** | |
| `pnpm lint` | new | **fail (unchanged)** | Same `6 problems (2 errors, 4 warnings)` as baseline. |

**Follow-up:** when a route returns a non-JSON 5xx, the client components can show the browser's raw parse message (e.g. `Unexpected token '<'`). That is not a server leak, but it breaks the "short and human" rule in brief §7, and it belongs with the Phase 2 component rebuild.

### 0.6 — Next.js security upgrade and production audit

**Target:** `next` 16.4.5 is npm `latest` and the newest 16.x (published 2026-11-03). The three Next advisories on 16.4.0 are patched in `>=16.4.1`. I followed the manual path in the installed docs (`node_modules/next/dist/docs/01-app/01-getting-started/18-upgrading.md`), because this is a patch upgrade within 16.4 with no migration guide. `next upgrade --agent` was not used.

**Changes**

| Package | Before | After | Why |
|---|---|---|---|
| `next` | 16.4.0 (`^16.2.6`) | 16.4.5 (`^16.4.5`) | 2 critical RCE + 1 high DoS; `SecurityFatalError` on build |
| `eslint-config-next` | `^16.2.6` | 16.4.5 (`^16.4.5`) | kept in step with `next` (brief 0.6) |
| `payload`, `@payloadcms/{next,db-postgres,richtext-lexical}` | 3.90.2 (`^3.84.0`) | 3.92.1 (`^3.92.1`) | pins `undici@7.30.1`, which clears 6 high `undici` advisories |
| `dompurify` (via `@payloadcms/ui` → `@monaco-editor/react` → `monaco-editor@0.57.0`, exact pin) | 3.4.15 | 3.4.17 via `pnpm-workspace.yaml` `overrides` (scoped to `monaco-editor>dompurify`) | 1 critical + 1 high |
| In-range transitive updates (`pnpm update -r --depth Infinity …`) | | `body-parser` 1.20.9, `multer` 2.5.0, `follow-redirects` 1.16.2, `ansi-regex` 4.1.1/5.0.1, `happy-dom` 20.14.6, newer `lodash`/`zod`/`@graphql-tools/utils` where ranges allowed | patch/minor security releases within declared ranges |

Payload 3.93.0 (published 2026-11-04) was tried first. pnpm accepted it only by writing `minimumReleaseAgeExclude` entries into `pnpm-workspace.yaml`, i.e. by bypassing its release-age safeguard. That was reverted. 3.92.1 (2026-10-27) carries the same `undici` fix without an exclusion. See ADR-012.

**Checks (after)**

| Command | Env | Result | Key output |
|---|---|---|---|
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` | Win10, Node 24.15.0 | **pass** | `▲ Next.js 16.4.5`, `✓ Compiled successfully`, full route table; no security notice. Prerender logged Payload `28P01 password authentication failed` from the known local Postgres credential problem (handoff, task 0.7); pages fell back and the build completed. |
| `pnpm typecheck` | same | **pass** | |
| `pnpm test` | same | **pass** | `Tests 21 passed (21)` |
| `pnpm tokens:check` | same | **pass** | `Contrast check passed for 7 label themes.` |
| `pnpm lint` | same | **fail (unchanged)** | `6 problems (2 errors, 4 warnings)`, same as baseline |
| `pnpm audit --prod` | same | 7 high, 0 critical | was `10 low \| 21 moderate \| 19 high \| 3 critical`; now `4 low \| 10 moderate \| 7 high \| 0 critical` |

**Remaining high findings (recorded, not fixed)**

| Advisory | Package@version | Path | Why not fixed now | Plan |
|---|---|---|---|---|
| GHSA-834v-8h66-3h79, GHSA-c8p4-j97h-3vg8 | `happy-dom@20.14.6` | storefront → `@payloadcms/richtext-lexical` → `@lexical/headless` (`^20.9.0`) | The 20.x fix (`>=20.14.7`) is not published; the other fix needs 21.x, a major jump inside Lexical's headless DOM. Exposure: server-side parsing of rich-text HTML written by authenticated Payload editors. | Re-check on every Payload bump; override to 21.x only with a rich-text HTML conversion test. |
| GHSA-r5fr-rjxr-66jc | `lodash@4.17.23` | medusa → `@medusajs/utils` and others | Pinned inside `@medusajs/*` 2.21.2 | Evaluate Medusa 2.22.x in task 0.8, where a clean Linux Medusa build can verify it (local Medusa build is broken, audit N1). |
| GHSA-mrhx-c7xc-m3w5 | `zod@4.2.0` | medusa → `@medusajs/deps`, `@medusajs/utils` | Same | Same |
| GHSA-7mx3-vvmw-hjmv, GHSA-c4qx-w738-7hr3 | `@graphql-tools/utils@10.11.0` | medusa → `@medusajs/utils`, `@medusajs/modules-sdk` | Fix is 12.x (major) | Same |
| GHSA-ph9p-34f9-6g65 | `tmp@0.0.33` | medusa → `@medusajs/cli` → `inquirer` | Fix is 0.2.x; CLI-only path | Same |

**Not verified:** the in-range transitive updates also changed the Medusa dependency tree (`body-parser`, `multer`, `follow-redirects`). `pnpm typecheck` passes for `apps/medusa`, but Medusa could not be built or booted locally (N1), so its runtime is unverified until task 0.8. CI's planned "fail on high/critical" gate (task 0.11) would fail on the 7 findings above. They need fixing or a documented, expiring allow-list by then.

### 0.7 — Payload baseline migration

**Environment findings**
- Docker: `docker version` → `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`; `C:\Program Files\Docker\Docker\Docker Desktop.exe` does not exist.
- Port 5432 is held by process `postgres` (PID 5828), the Windows service `postgresql-x64-18` (PostgreSQL 18, Running). This is why the `.env` Compose credentials got `28P01`. The service was only inspected, never modified.

**CLI loader attempts** (Payload 3.92.1, Node 24.15.0, from `apps/storefront` with `.env` loaded)

| Attempt | Result |
|---|---|
| `payload migrate:create initial_schema` (default `tsx`) | **fail**: `TypeError: Illegal constructor` at `undici/lib/web/cache/cachestorage.js:17`. `tsx` + `undici` load fine in isolation, so the conflict is with Payload's own `module.registerHooks` Lexical resolve hook (`dist/bin/index.js:29-34`). |
| `… --disable-transpile` (Node native TS) | **fail**: `ERR_MODULE_NOT_FOUND … src/collections/Campaigns` (extensionless imports) |
| `… --use-swc` (after adding `@swc-node/register`, `@swc/core` dev deps) | **fail**: `Named export 'AnnouncementBar' not found … is a CommonJS module` (no `"type": "module"`) |
| `… --use-swc` with `"type": "module"` in `apps/storefront/package.json` | **pass**: `Migration created at …/src/migrations/20261105_144453_initial_schema.ts` |
| `pnpm payload migrate:create no_changes_check --skip-empty` (new root script) | **pass**, no file written, so config and migration are in sync |

`migrate:create` runs with `disableDBConnect: true` (`payload/dist/bin/migrate.js:40`), so no database was contacted. `@swc/core`'s postinstall is disabled in `allowBuilds` (`false`); its Windows native binary comes from the optional platform package.

**Review of `20261105_144453_initial_schema.ts`**
- `up()`: 24 `CREATE TYPE` + 55 `CREATE TABLE` (corrected from an earlier miscount of 68), all in `"payload"`; 215 `CREATE INDEX`; 76 foreign keys. No statement references `public`. No `DROP` before `down()`.
- Label enums are exactly `next, trybe, prime, men, fashion, bridal, lopaworld`, matching `packages/types`.
- **Reviewed addition:** `CREATE SCHEMA IF NOT EXISTS "payload";` as the first statement of `up()`. The adapter creates the schema only when it creates the database itself (`@payloadcms/drizzle/dist/postgres/createDatabase.js:53`, reached only on `database … does not exist`, `db-postgres/dist/connect.js:89-92`). In the brief's first-deploy order, Medusa creates the shared database first. `down()` leaves the schema in place.

**Other changes:** `payload.config.ts` sets `prodMigrations: migrations` (`db-postgres/dist/connect.js:116-120` runs them on connect when `NODE_ENV=production`). `docker/storefront.Dockerfile` `CMD` is now `["pnpm", "start"]` (B8). `src/migrations/**` is excluded from ESLint (generated code; 4 unused-parameter warnings).

**Checks (after)**

| Command | Result |
|---|---|
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` | **pass** (`✓ Compiled successfully`) with `"type": "module"` |
| `pnpm typecheck` | **pass** |
| `pnpm test` | **pass**, 21/21 |
| `pnpm lint` | **fail (unchanged)**, 6 problems, same as baseline |

**Applying it:** see "0.7 — applied to a fresh Postgres 17" below. The first attempt was blocked: Docker was not installed, and the native PostgreSQL 18 service needs credentials Claude does not hold.

**New finding:** Payload warns `Image resizing is enabled … but sharp not installed`. `Media` defines image sizes, so resizing and derived sizes will not work until `sharp` is installed and passed to `buildConfig` (Phase 1.2/1.3 media work).

### 0.7 — applied to a fresh Postgres 17

**Environment:** the owner installed Docker Desktop (engine 29.8.2, linux/amd64; Compose v5.5.1) after enabling hardware virtualisation in firmware. Disposable database from `pnpm db:verify:up`: PostgreSQL 17.11 (`postgres:17-alpine`), `127.0.0.1:5433`, tmpfs, no volume. Before each run: `0` rows for schema `payload`.

| Step | Command | Result | Key output |
|---|---|---|---|
| CLI apply | `DATABASE_URL=…5433/lopaworld_verify pnpm payload migrate` | **pass** | `Migrated: 20261105_144453_initial_schema (1004ms)` |
| Status | `pnpm payload migrate:status` | **pass** | `20261105_144453_initial_schema │ 1 │ Yes` |
| Contents | `psql` counts | as reviewed | 55 tables and 24 enums in `payload`; 0 tables in `public`; `enum_labels_slug` = `next,trybe,prime,men,fashion,bridal,lopaworld` |
| Reversible | `pnpm payload migrate:down`, then `migrate` | **pass** | down in 699 ms → 0 `payload` tables; re-applied in 1095 ms |
| Production path | fresh instance; `next build` (not pointed at it); `NODE_ENV=production next start` against it; `GET /`, `GET /admin` | **pass** | Server log: `Migrating: 20261105_144453_initial_schema` → `Migrated (671ms)` on first request. `GET /` 200; `GET /admin` 200, `<title>Dashboard - Payload \| Lopaworld</title>` with the create-first-user screen. DB afterwards: 55 tables, `payload_migrations` = `20261105_144453_initial_schema batch=1`, 0 users. |
| Cleanup | stop server; `pnpm db:verify:down` | done | 0 `lopaworld-verify` containers; `docker volume ls` empty |

**Notes**
- `prodMigrations` runs on Payload's first connection (the first request that touches Payload), not at process start.
- Because `next build` runs with `NODE_ENV=production`, a build whose `DATABASE_URL` reaches a real database would apply migrations during the build. The Dockerfile's build-time URL (`127.0.0.1:5432/build`) is unreachable inside the build container, so this cannot happen in image builds; keep it that way.
- Payload admin loading against the **Medusa-shared** database, and `/api/ready`, belong to the Phase 0 stack acceptance (tasks 0.9–0.10).

### 0.8 — Medusa production artefact (proven on clean Linux in GitHub Actions)

The local Linux probe (`docker build --target build` on this workstation) was stopped after about 20 minutes still inside `pnpm install`: registry downloads were very slow and some failed and retried. The owner chose GitHub Actions instead. The new workflow `.github/workflows/images.yml` builds the image without pushing it anywhere, then boots it.

**Root causes found and fixed**

| # | Symptom | Cause | Fix |
|---|---|---|---|
| N1 | `Cannot find module './maps.js'` from `emittery@0.13.0` (Windows **and** Linux CI) | The npm tarball of `emittery@0.13.0` (2022-08-25 03:36) contains only `license, index.js, package.json, readme.md, index.d.ts`, although `index.js` requires `./maps.js`. `0.13.1`, published 6 h later, adds it. The lockfile pinned 0.13.0 via `umzug@3.8.2` (`^0.13.0`) → `@mikro-orm/migrations` → `@medusajs/deps`. | `pnpm update -r --depth Infinity emittery` → `0.13.1` (lockfile-only, within range) |
| — | `Cannot find module 'ts-node'`, then `Error in loading config` | The Medusa CLI loads `medusa-config.ts` through `ts-node`; the app never declared it | `ts-node` dev dependency |
| — | `Backend build completed successfully`, but no backend files emitted | `apps/medusa/tsconfig.json` had `"noEmit": true` | Removed it; `rootDir: "./"`, `outDir: "./.medusa/server"` as in Medusa's starter. The `typecheck` script keeps `--noEmit`. |
| — | Vite: cannot resolve `react/jsx-dev-runtime`, `@medusajs/dashboard`, `@medusajs/draft-order/admin`, `@medusajs/admin-shared`; then `"defineRouteConfig" is not exported by "__vite-optional-peer-dep:@medusajs/admin-sdk…"` | pnpm's strict layout: the admin entry and the admin Vite plugin's virtual modules resolve from the app, and `@medusajs/draft-order`'s admin bundle uses **optional peers** that pnpm only links when the app declares them | Build-time dev dependencies at the versions already locked: `react`/`react-dom` 18.3.1, `@medusajs/{dashboard,admin-sdk,admin-shared,draft-order,icons}` 2.21.2, `@medusajs/ui` 4.2.6, `react-router-dom` 7.18.2 |
| — | Workspace packages would load TypeScript from `node_modules` at runtime | Both `@lopaworld/*` packages export `./src/index.ts` | `tsc` build to `dist`, with `publishConfig` exports → `dist` (dev and Next keep `src`) |
| — | `pnpm deploy --prod --legacy` links `@lopaworld/*` to their source; non-legacy deploy refuses (`ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE`) | pnpm 11 requires workspace-wide `inject-workspace-packages` for non-legacy deploy, which would change dev linking for every package | Keep `--legacy`; replace each `@lopaworld/*` link with its `pnpm pack` output (publishConfig applied, `dist` only) |
| — | CI: guard "links outside /app" failed | Legacy deploy leaves `node_modules/.pnpm/node_modules/@lopaworld/medusa` linked to the workspace app source | Remove that self-link |

**Image (`docker/medusa.Dockerfile`)**
- Build stage: install → build `@lopaworld/types` and `@lopaworld/payment-paystack` → `medusa build` (placeholder build-time env, unreachable DB) → `pnpm deploy --prod --legacy /app` → swap in packed workspace packages → overlay `.medusa/server` (except its `package.json`, which still says `workspace:*`).
- Build-time guards: both workspace packages export `dist`; `import('@lopaworld/payment-paystack')` and `import('@lopaworld/types')` succeed from `/app`; `medusa-config.js` and `public/admin` exist; no link resolves outside `/app`.
- Runtime stage: `node:24.15.0-bookworm-slim`, only `/app` copied, `USER node`, `CMD` runs `medusa db:migrate` then `medusa start`.

**Checks**

| Command / run | Env | Result | Key output |
|---|---|---|---|
| `pnpm --filter @lopaworld/medusa build` (with `.env`) | Win10, Node 24.15.0 | **pass** | `Backend build completed successfully (27.13s)`, `Frontend build completed successfully (142.04s)`; `.medusa/server` holds `medusa-config.js`, `src/…`, `public/admin` |
| local `pnpm deploy --prod --legacy` + pack swap | same | **pass** | both `@lopaworld/*` export `./dist/index.js`; `import()` of both succeeds from the deployed tree |
| Images [run 42061720916](https://github.com/techyabraham/lopaworld/actions/runs/42061720916) @ `7f07c04` | ubuntu-latest | fail | `medusa build` step (emittery, before the fixes above) |
| Images [run 42067586671](https://github.com/techyabraham/lopaworld/actions/runs/42067586671) @ `6a3f965` | ubuntu-latest | fail | build-time guard: link outside `/app` (the self-link) |
| Images [run 42068296986](https://github.com/techyabraham/lopaworld/actions/runs/42068296986) @ `084882e` | ubuntu-latest | **pass** | build, boot, health, admin, migrations |
| Images [run 42069950453](https://github.com/techyabraham/lopaworld/actions/runs/42069950453) @ `4fa45b1` | ubuntu-latest | **pass** | notices: `Medusa image size: 173 MB (target <= 600 MB)`; `GET /health -> 200 after ~16s`; `GET /app (admin) -> 200`; `Medusa tables after db:migrate: 147` |

Boot used a fresh `postgres:17-alpine` and `redis:7-alpine` and CI-only placeholder values. That includes a deliberately fake Paystack test key (`sk_test_ci_placeholder`), so the Paystack provider package is registered at boot; Medusa would fail to start if it could not load it. No call to Paystack is made.

**Caveats**
- `173 MB` is `docker image inspect --format '{{.Size}}'`. Under Docker's containerd image store this can be the compressed content size; 0.9 should record both compressed and uncompressed sizes.
- Job logs and the job summary require GitHub authentication (`gh` is not signed in on this workstation; logs API returned 403). Results were read from the public runs/jobs/annotations APIs. The workflow now publishes measurements as `::notice` and failures as `::error` annotations.
- The repository is **publicly readable**: the GitHub API answered without authentication.

**Medusa 2.22.x evaluation (audit leftovers from 0.6)**
- Candidate under ADR-012: **2.22.2** (2026-10-30). 2.22.3 (2026-11-04) is younger than the release-age gate.
- It would fix 2 of the 5 Medusa-side high findings: `zod` (`@medusajs/deps` pins 4.6.6 instead of 4.2.0) and `tmp` (`@medusajs/cli` moves to `inquirer@^14`, which no longer depends on `tmp`).
- It would not fix `lodash@4.17.23` or `@graphql-tools/utils@10`: `@medusajs/utils` 2.21.2 and 2.22.2 both require `@graphql-codegen/core@^4.0.2` → `@graphql-codegen/plugin-helpers@5` (`lodash ~4.17.0`). The fix for those needs `@graphql-codegen/core` 6.x upstream.
- Not done: it is a framework minor upgrade touching every `@medusajs/*` package, the Paystack peer pin and the admin build pins. It is proposed as its own change, verified by the same Images workflow.

**Housekeeping:** a local `pnpm deploy --prod` test left the workspace `node_modules` flagged production-only, and the next `pnpm typecheck` aborted in pnpm's dependency pre-check. `pnpm install --frozen-lockfile --config.confirmModulesPurge=false` restored it; typecheck (5/5), tests (21/21) and lint (baseline) were then re-run. One pair of commits (`af4b717`, `6a3f965`) was pushed while that check was red; after the restore the same code passed, so no follow-up commit was needed.

### 0.9 — Production Dockerfiles (B9)

**Storefront** (`docker/storefront.Dockerfile`, `apps/storefront/next.config.ts`)
- `output: 'standalone'` with `outputFileTracingRoot` at the monorepo root, per the installed Next docs (`01-app/03-api-reference/05-config/01-next-config-js/output.md`: monorepo caveat; copy `public` and `.next/static` beside `server.js`).
- Build stage: install → `next build` with placeholder secrets and an **unreachable** `DATABASE_URL` (`next build` runs with `NODE_ENV=production`, so a reachable database would get migrations applied during the build) → copy `public` and `.next/static` into the standalone tree. The build fails if `server.js` is missing or the standalone output contains absolute links.
- Runtime stage: `node:24.15.0-bookworm-slim`, only `.next/standalone` copied to `/app`, `USER node`, `WORKDIR /app/apps/storefront`, `CMD ["node", "server.js"]`. `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` are build args.

**Medusa** (`docker/medusa.Dockerfile`): as in 0.8; already multi-stage, slim, non-root.

**`.dockerignore`:** now also excludes `.env*` at any depth (keeping `.env.example`), `*.pem`/`*.key`, local upload folders (`apps/storefront/public/media/uploads`, `apps/medusa/uploads`, `apps/medusa/static`, so local media can never be baked into an image), `.claude`/`.vscode`/`.idea`, and `docs`, `e2e`, `seed` and the Compose files, which no build uses.

**`coolify.compose.yaml`:** volume mounts moved to the new layouts, `medusa_uploads:/app/uploads` and `payload_media:/app/apps/storefront/public/media/uploads`. Medusa's local file provider still writes to `static/` by default (B5, Phase 1.2).

**Checks**

| Command / run | Env | Result | Key output |
|---|---|---|---|
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` | Win10, Node 24.15.0 | **pass** | `.next/standalone/apps/storefront/server.js`; standalone tree 78 MB; `public` 3.4 MB (3.1 MB Instagram reference set) |
| local `node server.js` from the standalone tree, `NODE_ENV=production`, fresh Postgres 17 (`pnpm db:verify:up`) | same | **pass** | `GET /` 200; `GET /_next/static/chunks/…css` 200; `GET /media/instagram/…jpg` 200; `GET /admin` 200 (`Dashboard - Payload \| Lopaworld`); log `Migrated: 20261105_144453_initial_schema (4538ms)`; DB discarded afterwards |
| `pnpm typecheck` / `pnpm test` / `pnpm lint` | same | pass / 21 of 21 / baseline 6 problems | |
| Images [run 42074110043](https://github.com/techyabraham/lopaworld/actions/runs/42074110043) @ `78f2cd6`, job **storefront** | ubuntu-latest | **pass** | `Storefront image size: inspect 109 MB, … 109 MB (target <= 400 MB)`; `GET / -> 200 after ~4s` with Medusa deliberately unreachable; static CSS 200; `/media/instagram/…jpg` 200; `GET /admin -> 200 <title>Dashboard - Payload \| Lopaworld</title>`; `Payload migrations applied in-process: 20261105_144453_initial_schema (55 tables)`; `runs as node` |
| same run, job **medusa** | ubuntu-latest | **pass** | `Medusa image size: inspect 173 MB, … 173 MB (target <= 600 MB)`; `GET /health -> 200 after ~18s`; `GET /app (admin) -> 200`; `Medusa tables after db:migrate: 147`; `runs as node` |

**Size measurement caveat:** the workflow labels the second figure "uncompressed (docker save)". Under Docker's containerd image store, `docker save` also exports compressed layer blobs, so both figures are probably compressed sizes. Unpacked sizes were not measured. Both images are well under their targets (109/400 MB, 173/600 MB) even allowing for a large decompression ratio. To measure exactly, add `docker run --rm --entrypoint du <image> -sxm /` to the workflow.

**Not done in 0.9:** the storefront healthcheck in `coolify.compose.yaml` still requests `/` (B10, task 0.10). Images are not pushed to a registry (release workflow, brief §6). The Compose file still has `build:` sections instead of GHCR `image:` references (brief §6, Phase 6 deploy).

### 0.10 — Health and readiness endpoints (B10)

**Change**
- `GET /api/health` (`apps/storefront/src/app/api/health/route.ts`): `200 {"status":"ok"}`, `Cache-Control: no-store`, no dependency checks.
- `GET /api/ready` (`src/app/api/ready/route.ts` + `src/lib/readiness.ts`): Payload database ping (`select 1` on the adapter's `pg` pool, after `getPayload`) and Medusa `GET /health`, run in parallel with 2 s timeouts each. Returns `200 {"status":"ready","checks":{…}}` or `503 {"status":"unavailable","checks":{…}}`. The body names which check failed; error detail goes only to `logServerError`. The first call also initialises Payload, which applies `prodMigrations` in production, so readiness stays 503 until migrations finish.
- Medusa keeps its built-in `/health`.
- `coolify.compose.yaml`: the storefront healthcheck requests `/api/health` (it was `/`, which rendered the full homepage).
- Both route files are dynamic in the build (`ƒ /api/health`, `ƒ /api/ready`). The installed Next docs (`01-getting-started/15-route-handlers.md:51`) say route handlers are not cached by default.

**Tests:** `src/lib/readiness.test.ts`, 8 tests:
- health answers without touching Payload or fetch;
- database ok, query failure, and Payload not initialising within the timeout;
- Medusa `/health` URL building, non-2xx and network failure;
- `/api/ready` 200, and 503 without error text.

`@payload-config` is aliased to a stub in `vitest.config.ts`.

**Checks**

| Command / run | Env | Result | Key output |
|---|---|---|---|
| `pnpm test` | Win10, Node 24.15.0 | **pass** | `Test Files 6 passed (6)`, `Tests 29 passed (29)` |
| `pnpm typecheck` | same | **pass** | |
| `pnpm lint` | same | baseline | 6 problems (a new `import/no-anonymous-default-export` warning in the test stub was fixed) |
| `dotenv -e .env -- pnpm --filter @lopaworld/storefront build` | same | **pass** | `ƒ /api/health`, `ƒ /api/ready` |
| Images [run 42080408883](https://github.com/techyabraham/lopaworld/actions/runs/42080408883) @ `7e11c13`, job **storefront** (Medusa deliberately absent) | ubuntu-latest | **pass** | `GET /api/health -> 200 {"status":"ok"}`; `GET /api/ready (Medusa down) -> 503 {"status":"unavailable","checks":{"database":"ok","medusa":"unavailable"}}`; size 109 MB; `runs as node` |
| same run, job **medusa** | ubuntu-latest | **pass** | as in 0.9 |
| same run, job **stack**: both images, one shared `postgres:17-alpine` database `lopaworld` + `redis:7-alpine`, Medusa started first | ubuntu-latest | **pass** | `GET /api/ready (full stack) -> 200 {"status":"ready","checks":{"database":"ok","medusa":"ok"}}`; `Shared database lopaworld: public tables 147, payload tables 55, payload migrations 20261105_144453_initial_schema`; `GET /admin -> 200; GET :9000/app -> 200` |

The stack job is the first real run of the production layout: Medusa migrates schema `public` first, then the storefront applies the Payload baseline into schema `payload` in the **same existing database**. This proves the reviewed `CREATE SCHEMA IF NOT EXISTS "payload"` addition from 0.7.

**Phase 0 acceptance status after 0.10**
- "`docker build` succeeds for both images on Linux. Sizes are recorded.": **met** (runs above; size caveat in 0.9).
- "A fresh empty Postgres plus `docker compose up` (local stack using the built images) boots. Payload admin loads, the Medusa admin loads, and `/api/ready` returns 200.": **met in CI with `docker run`** (stack job). Not yet run as `docker compose up` on this workstation.
- "CI is green on the PR": the `Images` workflow is green; the quality workflow (`ci.yml`) is task 0.11 and no PR is open yet.
- "Regression tests for B1–B3 fail on the old code and pass on the new code": **met** (0.2–0.4).

### 0.11 — CI quality gates

**`.github/workflows/ci.yml`** (on PRs and on pushes to `main`, `master` and `phase/**`; `contents: read`; concurrency per ref)
- Job `quality`: `postgres:17-alpine` and `redis:7-alpine` services; pnpm and Node from the repo pins (`packageManager`, `.node-version`); `PREVIEW_SECRET` added (N4).
- Steps: frozen install → font-glyph check → `pnpm typecheck` → `pnpm lint` → `pnpm test` (Vitest, both packages) → `pnpm tokens:check` → `pnpm audit:gate` → Playwright design-system tests (dev server on its **own** database `ci_dev`) → `pnpm build`. Build failures publish the log tail as an annotation.
- Job `secrets`: gitleaks v8.18.4 (`zricethezav/gitleaks`) over the full git history (`fetch-depth: 0`), run as the runner user, `--redact`.

**Audit gate** (`scripts/audit-gate.mjs`, `security/audit-allowlist.json`, ADR-013): fails on any high/critical production advisory that is not allow-listed or whose entry has expired; warns about stale entries. Local negative test: with one entry expired and one removed, the gate printed `allow-list entry expired 2026-11-01 …` and `not allow-listed … zod` and exited 1. With the real list it exited 0 (`7 high/critical finding(s), all allow-listed and unexpired`).

**Playwright against the booted stack:** `e2e/stack/smoke.spec.ts` via `playwright.stack.config.ts` (`pnpm test:e2e:stack`), run by the Images workflow's `stack` job against the built images on one shared Postgres:
- health/ready;
- the homepage shell;
- the empty-bag state;
- `/shop` degrading without a catalogue;
- both admins in a real browser.

The main Playwright config ignores `e2e/stack`.

**Problems the new gates found and fixed**

| # | Found by | Problem | Fix |
|---|---|---|---|
| N5 | `pnpm lint` | `react-hooks/set-state-in-effect` in `WishlistButton.tsx` and `AnalyticsConsent.tsx` | Shared `useLocalStorageValue` hook (`useSyncExternalStore`): cross-tab and in-tab sync, `undefined` during SSR/hydration. Verified in the browser: fresh visitor sees the consent prompt; reject stores `rejected` and shows the settings button; reopen works; reload remembers the choice. Lint now **0 errors** (4 `<img>` warnings remain, B6). |
| N8 | stack smoke test (real browser) | `/admin` crashed after load: React hydration error #418, then `insertBefore`/`removeChild` DOM errors. Cause: `app/layout.tsx` rendered `<html>` around Payload's own `RootLayout`, nesting two documents. curl-based checks only saw the server-rendered 200. | The site root layout, `globals.css` and the `(store)`, `dev` and `preview` routes moved into an `app/(site)` route group (Payload's expected structure). URLs unchanged; 21 files' relative imports rewritten by script. Verified on the production standalone server in a fresh tab: `/admin` → `/admin/create-first-user` and `/` both with **no console messages**. |
| N9 | CI `pnpm build` | `next dev` (Playwright design-system tests) let Payload push its schema into the CI database; the following `next build` (migrations via `prodMigrations`) stopped at Payload's interactive prompt *"It looks like you've run Payload in dev mode … data loss will occur. Would you like to proceed?"*, and static page generation timed out. | Dev-server tests use a separate database (`ci_dev`); RUNBOOK documents the rule. |
| — | first CI build attempt | `pnpm build` failure had no readable detail without job-log access | Build log tail published as an annotation |

**Runs**

| Run | Commit | Result | Key output |
|---|---|---|---|
| CI [42084210819](https://github.com/techyabraham/lopaworld/actions/runs/42084210819) | `75e1636` | fail | every step up to the build passed (glyphs, typecheck, lint, Vitest, tokens, audit gate, Playwright 5/5); build failed (N9, not yet diagnosed); gitleaks passed |
| Images [42084210932](https://github.com/techyabraham/lopaworld/actions/runs/42084210932) | `75e1636` | fail | stack smoke 4/5; `both admin applications load` failed: `toHaveTitle(/Payload/)` received `""`, `<html id="__next_error__">` (N8) |
| CI [42088630437](https://github.com/techyabraham/lopaworld/actions/runs/42088630437) | `cb7ae99` | fail | build log annotation showed the Payload dev-push prompt (N9) |
| Images [42088630616](https://github.com/techyabraham/lopaworld/actions/runs/42088630616) | `cb7ae99` | **pass** | stack smoke `5 passed` after the layout fix |
| CI [42090639811](https://github.com/techyabraham/lopaworld/actions/runs/42090639811) | `0bf12ba` | **pass** | quality (all steps incl. `pnpm build`, Playwright `5 passed (18.5s)`) and secrets (gitleaks, full history) both green, ~3 min |
| Images [42090640055](https://github.com/techyabraham/lopaworld/actions/runs/42090640055) | `0bf12ba` | **pass** | storefront 110 MB, `/api/health` 200, `/api/ready` 503 with Medusa down, runs as node; medusa 173 MB, `/health` 200 after ~12s, 147 tables, runs as node; stack `/api/ready` 200, `public` 147 + `payload` 55 tables in one database, both admins 200, Playwright `5 passed (3.6s)` |

### 0.12 — Paystack provider tests

`packages/payment-paystack/src/service.test.ts`: **56 Vitest tests**, with Paystack's HTTP API stubbed (no network; placeholder test key). Covered:
- `validateOptions`;
- `initiatePayment`: kobo amounts, deterministic reference, context fallbacks, NGN-only, invalid input, API refusal;
- `toMinorUnits` half-up cases;
- `authorizePayment`, `updatePayment`, `retrievePayment`, `getPaymentStatus` mappings;
- amount, currency and reference mismatch (authorize and refund);
- capture/cancel/delete as no-ops;
- refund cap, zero amount and unsuccessful transaction;
- webhook: wrong key, body altered after signing, missing header, unsupported event, tampered amount, non-NGN currency, reference not derived from the metadata, missing metadata, missing reference, `charge.failed`, and **identical results for duplicate deliveries** (verify-only calls).

**`toMinorUnits` rounding** (brief: "e.g. 1999.995"): before writing tests, the current implementation was compared with exact decimal half-up rounding (`BigNumber#times(100).integerValue(ROUND_HALF_UP)`) for 1999.995, '1999.995', 1.005, 10.005, 12345.675, 150000.005, 249999.995, 1234567.895, 0.1+0.2, 99.99 and 150000. **All matched**: 1999.995 → 200000 kobo. The implementation was left unchanged and the tests pin that behaviour. (An initial suspicion of a float-rounding bug was checked and found to be wrong.)

**Mutation check** (each change applied alone, then `service.ts` restored byte-for-byte):

| Mutation | Result |
|---|---|
| webhook signature check returns `true` | 2 tests fail |
| authorize/refund amount comparison removed | 2 fail |
| webhook expected-amount check removed | 1 fails |
| `toMinorUnits` uses `Math.floor` | 3 fail |
| refund cap removed | 1 fails |

**Checks:** `pnpm test` locally: `packages/payment-paystack … Tests 56 passed (56)`, `apps/storefront … Tests 29 passed (29)`. In CI, the same `pnpm test` step passed in [42090639811](https://github.com/techyabraham/lopaworld/actions/runs/42090639811). `pnpm typecheck` and `pnpm lint` (0 errors) pass locally. `vitest@5.1.0` added as a dev dependency of the package (already in the lockfile; 4-line lockfile change).

**Not covered:** live Paystack *test-mode* round trips (success, decline, abandon, delayed webhook, refund). These need Paystack test credentials and a reachable webhook URL; Phase 6.1 and OPEN_ITEMS track them.

## Phase 0 acceptance (5 November 2026)

| Criterion | Status | Evidence |
|---|---|---|
| CI is green on the PR (link the run) | **Green on the branch**: CI [42090639811](https://github.com/techyabraham/lopaworld/actions/runs/42090639811) and Images [42090640055](https://github.com/techyabraham/lopaworld/actions/runs/42090640055) at `0bf12ba`. The PR runs the same workflows. | 0.11 |
| `docker build` succeeds for both images on Linux; sizes recorded | **Met**: storefront 110 MB, Medusa 173 MB (size caveat in 0.9) | 0.8, 0.9, 0.11 |
| Fresh empty Postgres + local stack from the built images boots; Payload admin loads; Medusa admin loads; `/api/ready` 200 | **Met in CI** (stack job, `docker run`, one shared database, real-browser admin check). Not run as `docker compose up` on this workstation. | 0.10, 0.11 |
| Regression tests for B1–B3 fail on the old code and pass on the new code | **Met** | 0.2–0.4 |
