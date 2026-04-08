FROM node:22-alpine

RUN apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${APP_PORT:-3000}

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
