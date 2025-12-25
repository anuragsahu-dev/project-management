# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose ports
EXPOSE 3000 3001

# Start the application
CMD ["node", "dist/index.js"]
