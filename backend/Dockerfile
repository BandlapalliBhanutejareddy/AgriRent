FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
