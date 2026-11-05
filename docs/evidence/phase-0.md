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
