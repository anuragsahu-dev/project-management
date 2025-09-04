FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

# Generate Prisma client after schema is copied
ENV PRISMA_GENERATE_SKIP_DB=1
RUN npx prisma generate

RUN npm run build

RUN npm prune --omit-dev


FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/wait-for-it.sh  /usr/local/bin/wait-for-it.sh

RUN useradd -m taskmanager && chown -R taskmanager:taskmanager /app

RUN chmod +x /usr/local/bin/wait-for-it.sh

EXPOSE 3000

USER taskmanager

ENTRYPOINT ["wait-for-it.sh", "redis:6379", "--"]
CMD ["node", "index.js"]