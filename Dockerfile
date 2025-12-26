# syntax=docker/dockerfile:1

# =============================================================================
# Base stage - shared dependencies
# =============================================================================
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# =============================================================================
# Dependencies stage - install all dependencies
# =============================================================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# =============================================================================
# Builder stage - build the application
# =============================================================================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# =============================================================================
# Migrator stage - for running database migrations
# =============================================================================
FROM base AS migrator

WORKDIR /app

# Copy only what's needed for migrations
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma/

# Default command runs migrations
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# =============================================================================
# Worker stage - for running BullMQ analysis worker
# =============================================================================
FROM base AS worker

WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/services ./services/
COPY --from=builder /app/lib ./lib/
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV=production

# Run the analysis worker
CMD ["npx", "tsx", "services/workers/analysis-worker.ts"]

# =============================================================================
# Runner stage - production application
# =============================================================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma/

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
