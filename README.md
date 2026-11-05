# Lopaworld

Mobile-first Nigerian fashion storefront across seven labels, using one catalogue, bag and checkout. The repository includes the storefront/Payload CMS, Medusa commerce foundation, shared design system, local service stack, and a prepared Coolify deployment definition.

The codebase is **not launch-ready**: catalog and policy inputs, the initial Payload database migration, security/build fixes, staging validation, production secrets, and operational setup remain outstanding. Start with the [engineering handoff](docs/ENGINEERING-HANDOFF.md), which maps the system and its current blockers.

## Start locally

See [the local runbook](docs/RUNBOOK.md) for prerequisites and the first-run steps. In short: copy `.env.example` to `.env`, start Docker dependencies with `pnpm infra:up`, install with `pnpm install`, then run `pnpm dev`.

For Contabo VPS deployment through Coolify, see the [deployment guide](docs/COOLIFY-CONTABO.md) and the repository's `coolify.compose.yaml`. The detailed architecture, code map, and owner handoff are in [docs/ENGINEERING-HANDOFF.md](docs/ENGINEERING-HANDOFF.md).

Product, label and delivery content is intentionally not invented; see [open owner inputs](docs/OPEN_ITEMS.md). See [the launch plan](docs/LAUNCH-PLAN.md) for deployment acceptance and rollback requirements.
