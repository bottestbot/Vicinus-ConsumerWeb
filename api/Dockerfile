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

# railway.json's preDeployCommand is ignored once a service builds from a
# Dockerfile — run migrations here instead so schema changes actually reach
# prod on deploy (previously they silently never applied).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
