FROM node:24.15.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
RUN PAYLOAD_SECRET=build-only-payload-secret-0000000000000000 \
    PREVIEW_SECRET=build-only-preview-secret-0000000000000000 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    pnpm --filter @lopaworld/storefront build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /workspace /workspace
WORKDIR /workspace/apps/storefront
RUN mkdir -p public/media/uploads && chown -R node:node public/media/uploads
USER node
EXPOSE 3000
# Payload migrations run in-process on first connect (prodMigrations in payload.config.ts).
CMD ["pnpm", "start"]
