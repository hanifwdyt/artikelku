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

CMD ["sh", "-c", "echo 'Starting...' && mkdir -p /app/data && echo 'Running prisma db push...' && npx prisma db push --skip-generate --accept-data-loss 2>&1; echo 'Prisma exit code: '$? && echo 'Starting Next.js...' && npm run start 2>&1"]
