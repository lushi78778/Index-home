# Multi-stage Dockerfile for Next.js App Router project
# 1) Builder stage: install deps & build
FROM node:20-alpine AS builder
WORKDIR /app

# Install system deps if needed
RUN apk add --no-cache libc6-compat

# Copy manifests first for better caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Prefer npm ci when lockfile exists
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest
COPY . .

# Generate config and build
RUN npm run config && npm run build

# 2) Runner stage: minimal runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
# Note: runtime environment variables will be provided via Docker Compose or the orchestrator

# Expose port
EXPOSE 3000

# Next.js requires this to be set when running standalone, but we keep node_modules
ENV PORT=3000

USER nextjs
CMD ["npm", "run", "start"]
