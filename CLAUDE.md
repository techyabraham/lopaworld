# CLAUDE.md — standing rules for Claude in this repository

Claude loads this file automatically. Keep it short. The full plan lives in `docs/CLAUDE-BUILD-BRIEF.md`.

## Read first, every session
1. `AGENTS.md` (repository rules; all still apply)
2. `docs/CLAUDE-BUILD-BRIEF.md` (mission, phases, gates, acceptance criteria)
3. `docs/AUDIT-2026-11.md` (known defects B1–B13)
4. `docs/OPEN_ITEMS.md` (facts you may not invent)
5. For Next.js: `apps/storefront/node_modules/next/dist/docs/` (Next 16 is newer than your training data)

## Hard rules
- Never invent Lopaworld business facts. Hide a UI module when its facts are missing; never show placeholder copy to customers.
- Never deploy to production, change DNS, use live Paystack keys, charge or refund, delete or restore data, remove volumes, or force-push without the owner's explicit written approval in the conversation.
- Stop at the Decision Gates (brief §8): prepare the options and a recommendation in `docs/DECISIONS.md`, then ask.
- One branch and one PR per phase. Conventional commits. Never commit to `main` directly.
- Only claim a check passed if you ran it in this session. Record evidence in `docs/evidence/phase-<n>.md`.
- Medusa owns prices, stock, carts and orders. Payload owns editorial. Never copy prices or stock into Payload.
- Schema changes must be backward compatible (expand → migrate → contract) so rollbacks never need a database restore.
- Secrets stay in Coolify and GitHub secrets only.

## Commands
`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` (added in Phase 0.11) · `pnpm tokens:check` · `pnpm test:e2e` · `pnpm build` · `pnpm infra:up`

## End every session with the report format in brief §10.
