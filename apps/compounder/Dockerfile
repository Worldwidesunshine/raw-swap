# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NPM_CONFIG_FETCH_RETRIES=6
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

FROM base AS deps
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/compounder/package.json apps/compounder/
COPY packages/shared/package.json packages/shared/
COPY packages/lp-sdk/package.json packages/lp-sdk/
RUN apk add --no-cache --virtual .native-build-deps python3 make g++ libc6-compat
RUN pnpm install --filter @rawswap/compounder... \
  && apk del .native-build-deps

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/lp-sdk packages/lp-sdk
COPY apps/compounder apps/compounder
RUN pnpm --filter @rawswap/shared build && pnpm --filter @rawswap/lp-sdk build && pnpm --filter @rawswap/compounder build

FROM base AS runner
WORKDIR /app
COPY --from=build /app/apps/compounder/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
