# Medusa production image. The runtime stage holds only the compiled `.medusa/server` output and a
# production-only dependency tree from `pnpm deploy`; no workspace source or dev dependencies ship.
FROM node:24.15.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /workspace

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production
# Workspace packages are consumed as TypeScript in development; production resolves their compiled
# `dist` through `publishConfig`, because Node does not strip types inside node_modules.
RUN pnpm --filter @lopaworld/types --filter @lopaworld/payment-paystack build
# Placeholder values only satisfy medusa-config.ts at build time; nothing connects to them.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    REDIS_URL=redis://127.0.0.1:6379 \
    STORE_CORS=https://build.invalid \
    ADMIN_CORS=https://build.invalid \
    AUTH_CORS=https://build.invalid \
    JWT_SECRET=build-only-jwt-secret-0000000000000000000000 \
    COOKIE_SECRET=build-only-cookie-secret-0000000000000000000000 \
    pnpm --filter @lopaworld/medusa build
RUN pnpm --filter @lopaworld/medusa deploy --prod --legacy /deploy \
 && rm -rf /deploy/src /deploy/medusa-config.ts /deploy/tsconfig.json \
 && cd apps/medusa/.medusa/server \
 && tar --exclude=./package.json -cf - . | tar -xf - -C /deploy
# Fail the build if a workspace package would load TypeScript source at runtime.
RUN cd /deploy \
 && node -e "for (const n of ['payment-paystack','types']) { const e = JSON.stringify(require('./node_modules/@lopaworld/'+n+'/package.json').exports); if (!e.includes('dist')) throw new Error(n+' resolves to source: '+e); }" \
 && node --input-type=module -e "const m = await import('@lopaworld/payment-paystack'); const t = await import('@lopaworld/types'); if (!m.default || !t.LABELS) throw new Error('workspace package exports missing'); console.log('workspace packages resolve from dist')" \
 && test -f medusa-config.js && test -d public/admin

FROM node:24.15.0-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=9000
WORKDIR /app
COPY --from=build --chown=node:node /deploy /app
RUN mkdir -p uploads static && chown node:node uploads static
USER node
EXPOSE 9000
CMD ["sh", "-c", "./node_modules/.bin/medusa db:migrate && exec ./node_modules/.bin/medusa start"]
