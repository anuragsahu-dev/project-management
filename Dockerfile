# =============================================================================
# PRODUCTION DOCKERFILE - Budget Tracker
# Multi-stage build for optimized production image
# =============================================================================

FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Generate Prisma client (outputs to src/generated/prisma)
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies
RUN npm prune --omit=dev


FROM node:22-slim AS runner

WORKDIR /app

# Install wget for healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m appuser

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy Prisma schema (needed for migrations)
COPY --from=builder /app/prisma ./prisma

# Copy Prisma generated client to BOTH locations to ensure it works
# TypeScript compiles src/generated → dist/generated, so we need it there
COPY --from=builder /app/src/generated ./dist/generated

# Create logs directory and set ownership BEFORE switching to non-root user
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
