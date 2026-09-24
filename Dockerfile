# Production image for the OnCoopera NestJS API.
# Dockerfile.dev remains the local-development image (bind mount + nest start --watch).

FROM node:22-slim AS builder

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build


FROM node:22-slim AS runtime

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl procps \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /usr/src/app/src/prisma/schema.prisma ./src/prisma/schema.prisma

EXPOSE 3000

CMD ["node", "dist/src/main"]