# ---- Build Stage ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src/

RUN npx prisma generate
RUN npm run build

# ---- Production Runtime Stage ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV OPENSSL_CONF=/dev/null

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
