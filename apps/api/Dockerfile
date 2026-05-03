FROM node:20-alpine

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
# Relax flaky registry behavior during image `pnpm install` (CI / home networks).
ENV NPM_CONFIG_FETCH_RETRIES=6
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

WORKDIR /app

RUN apk add --no-cache --virtual .native-build-deps python3 make g++ libc6-compat

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

COPY . .

RUN pnpm install --frozen-lockfile --prod=false \
  && apk del .native-build-deps

RUN pnpm build:libs && pnpm --filter @rawswap/api build

EXPOSE 3001

CMD ["pnpm", "--filter", "@rawswap/api", "start"]
