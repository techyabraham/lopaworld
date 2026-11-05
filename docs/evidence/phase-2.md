# Phase 2 evidence — Entrance design

Branch `phase/2-entrance-design`. Instructions: `docs/design/APPLY-ENTRANCE-DESIGN.md`. Every result below was observed in the session that recorded it.

## Preconditions (§0) — 6 November 2026

- **§0.1 Phase 0 merged into `master`: not met.** No PR existed for `phase/0-stabilise`, and `origin/master` (`340d8b2`) did not contain its 34 commits. Claude stopped and asked; the owner replied "Start right away".
- **§0.2 deviation, owner-approved:** instead of branching from `master`, `phase/2-entrance-design` was created from `phase/0-stabilise` (`5086417`), with `origin/master` merged in (`6b9ef60`: adds `docs/design/**`, no conflicts). Every path in the instructions assumes the Phase 0 layout (`app/(site)/…`), so stacking avoids the conflicts §0.1 warns about. When Phase 0 merges, this branch's PR targets `master` and contains only Phase 2 commits.
- **§0.3** read: `CLAUDE.md`, `AGENTS.md`, the brief (§1, §4 Phase 2, §7, §8), the audit, `OPEN_ITEMS.md`, `DECISIONS.md`, the instructions, all four `docs/design/entrance/*.dc.html` and their README.

## §0.4 Baseline (before any Phase 2 change)

Environment: Windows 10 Pro 10.0.19045, Node 24.15.0, pnpm 11.19.0, Docker 29.8.2. Branch at `6b9ef60`.

| Command | Result | Key output |
|---|---|---|
| `pnpm install --frozen-lockfile` | **pass** | |
| `pnpm typecheck` | **pass** | 5 projects |
| `pnpm lint` | **pass** | `4 problems (0 errors, 4 warnings)`, all `@next/next/no-img-element` (B6) |
| `pnpm test` | **pass** | `payment-paystack 56 passed`, `storefront 29 passed` |
| `pnpm tokens:check` | **pass** | `Contrast check passed for 7 label themes.` |
| `pnpm build` (with `.env`, `DATABASE_URL` overridden to the disposable `db:verify` Postgres on 5433) | **pass** | types, payment-paystack, storefront and medusa `Done`. The dev database on 5434 was deliberately not used: it is a dev-push database, and a build that reaches a database applies migrations (Phase 0, N9). Next 16.4.5 (Turbopack) no longer prints per-route "First Load JS" in the build output, so §7's JS budget needs another measurement. |
| `pnpm test:e2e` | **pass** | first run failed (`Executable doesn't exist … chrome-headless-shell`): Playwright's browser was not installed locally. `pnpm exec playwright install chromium` (Chrome Headless Shell 156.0.8078.4, 118 MiB, Playwright CDN), then `5 passed (1.4m)` |

## "Before" screenshots

`node scripts/screenshots.mjs http://127.0.0.1:3100 docs/evidence/phase-2/before 390,1440`: production standalone build (`NODE_ENV=production`) on port 3100 against the disposable Postgres, full page, `deviceScaleFactor: 1`, analytics prompt pre-answered "rejected". All 12 routes answered 200.

| Route | 390 px | 1440 px |
|---|---|---|
| `/` | `before/home-390.png` | `before/home-1440.png` |
| `/l/trybe` | `before/label-trybe-390.png` | `before/label-trybe-1440.png` |
| `/shop` | `before/shop-390.png` | `before/shop-1440.png` |
| `/p/<handle>` | `before/pdp-no-local-catalogue-390.png` | `before/pdp-no-local-catalogue-1440.png` |
| `/bag` | `before/bag-390.png` | `before/bag-1440.png` |
| `/checkout` | `before/checkout-390.png` | `before/checkout-1440.png` |

**Limitation:** no Medusa catalogue runs locally, so there is no real product handle. The PDP capture shows the not-found state, and `/shop` and `/l/trybe` show the "catalogue unavailable" state. The "before" homepage also shows customer-facing placeholder copy that Phase 2 must remove: the hard-coded hero ("One house. Seven labels." / crochet line), the Instagram "Featured pieces" section (rights unverified), and the footer line "Customer support details will be published here once confirmed."
