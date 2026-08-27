FROM node:22-bookworm-slim
ENV OPENSSL_CONF=/dev/null

WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
