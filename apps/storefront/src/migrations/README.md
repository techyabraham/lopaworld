# Payload migrations

Create and commit the baseline Postgres migration before the first production deployment. See `docs/COOLIFY-CONTABO.md`. The storefront container runs `payload migrate` on startup; an empty migration directory does not create the Payload schema.
