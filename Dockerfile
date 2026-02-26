FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .
RUN npm run build

RUN mkdir -p /app/data

ENV DATABASE_URL="file:/app/data/nulis.db"

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p /app/data && npx prisma db push --accept-data-loss && npm run start"]
