# Storefront (Next.js + Payload) production image. The runtime stage holds only Next's standalone
# server with its traced node_modules, `.next/static` and `public`; no workspace source ships.
FROM node:24.15.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# Public values are inlined into the client bundle at build time; changing them needs a rebuild.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
# DATABASE_URL must stay unreachable here: `next build` runs with NODE_ENV=production, and Payload
# applies prodMigrations whenever it connects. The secrets are build-only placeholders.
RUN PAYLOAD_SECRET=build-only-payload-secret-0000000000000000 \
    PREVIEW_SECRET=build-only-preview-secret-0000000000000000 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    pnpm --filter @lopaworld/storefront build
# server.js serves public/ and .next/static only when they sit beside it (Next `output` docs).
RUN S=apps/storefront/.next/standalone/apps/storefront \
 && cp -R apps/storefront/public "$S/public" \
 && mkdir -p "$S/.next" \
 && cp -R apps/storefront/.next/static "$S/.next/static" \
 && test -f "$S/server.js" \
 && absolute=$(find apps/storefront/.next/standalone -type l -lname '/*' | head -5) \
 && if [ -n "$absolute" ]; then echo "absolute links in standalone output: $absolute"; exit 1; fi

FROM node:24.15.0-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /workspace/apps/storefront/.next/standalone ./
RUN mkdir -p apps/storefront/public/media/uploads && chown node:node apps/storefront/public/media/uploads
USER node
WORKDIR /app/apps/storefront
EXPOSE 3000
# Payload migrations run in-process on first connect (prodMigrations in payload.config.ts).
CMD ["node", "server.js"]
