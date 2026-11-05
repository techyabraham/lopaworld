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
