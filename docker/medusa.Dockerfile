FROM node:24.15.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    REDIS_URL=redis://127.0.0.1:6379 \
    STORE_CORS=https://build.invalid \
    ADMIN_CORS=https://build.invalid \
    AUTH_CORS=https://build.invalid \
    JWT_SECRET=build-only-jwt-secret-0000000000000000000000 \
    COOKIE_SECRET=build-only-cookie-secret-0000000000000000000000 \
    pnpm --filter @lopaworld/medusa build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=9000
COPY --from=build /workspace /workspace
WORKDIR /workspace/apps/medusa
RUN mkdir -p uploads && chown -R node:node uploads
USER node
EXPOSE 9000
CMD ["sh", "-c", "pnpm exec medusa db:migrate && exec pnpm start"]
