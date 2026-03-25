FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install

COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "dist/dev.js"]
