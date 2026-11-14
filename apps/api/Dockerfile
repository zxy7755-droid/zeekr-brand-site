# NestJS + Prisma runtime for the staging/production api slot.
# Debian slim (OpenSSL 3) is required: Prisma 5.16's musl engine needs
# libssl.so.1.1 on Alpine and fails with "Unable to require libquery_engine".
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
RUN npx prisma generate

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
