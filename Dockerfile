FROM node:22-bookworm-slim

WORKDIR /app

# Install build tooling for native deps (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "dist/index.js"]
