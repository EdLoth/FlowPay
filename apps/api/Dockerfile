FROM node:24-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --filter=@flowpay/api...

WORKDIR /app/apps/api

CMD ["pnpm", "dev"]