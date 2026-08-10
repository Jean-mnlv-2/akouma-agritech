FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get upgrade -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM deps AS build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts
# Generate Prisma client during build
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get upgrade -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

# Copy runtime files (including generated Prisma client and CLI)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts

EXPOSE 4000

CMD ["sh", "-c", "(npx prisma migrate deploy || true) && node dist/index.js"]
