FROM node:20-alpine

ARG NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ARG NEXT_PUBLIC_API_URL=http://localhost:3001

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SOLANA_RPC_URL=$NEXT_PUBLIC_SOLANA_RPC_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NPM_CONFIG_FETCH_RETRIES=6
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

WORKDIR /app

RUN apk add --no-cache --virtual .native-build-deps python3 make g++ libc6-compat

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

COPY . .

RUN pnpm install --frozen-lockfile --prod=false \
  && apk del .native-build-deps

RUN pnpm build:libs && pnpm --filter @rawswap/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@rawswap/web", "start"]
