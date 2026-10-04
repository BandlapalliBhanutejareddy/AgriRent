# ---- Build Stage ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm install --no-audit

COPY . .

RUN npm run build

# ---- Production Runtime Stage ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm install --only=production --no-audit

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npm", "start"]
