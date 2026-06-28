FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm install

COPY src/ ./src/

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/main"]
