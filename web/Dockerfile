# ---- Build Stage ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

ARG NEXT_PUBLIC_SUPABASE_URL=https://ezylxyrtnodxthdgynvn.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eWx4eXJ0bm9keHRoZGd5bnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDkxMjIsImV4cCI6MjA5MzcyNTEyMn0.hohg6GuliXMQ77e2sdotu79jL0WQkalq0VPe_RkOY58
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

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
