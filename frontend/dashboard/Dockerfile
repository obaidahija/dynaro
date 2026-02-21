# Stage 1: Build
# Build context must be frontend/ (parent of dashboard/) so shared/ is accessible
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared package
COPY shared/ ./shared/

# Copy dashboard
COPY dashboard/package.json dashboard/package-lock.json ./dashboard/

# Install dashboard dependencies
WORKDIR /app/dashboard
RUN npm ci

# Copy dashboard source
COPY dashboard/ ./

# Build args for NEXT_PUBLIC_ vars (must be available at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DISPLAY_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DISPLAY_URL=$NEXT_PUBLIC_DISPLAY_URL

# Build Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dashboard/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dashboard/public ./public

USER nextjs

# Cloud Run injects $PORT at runtime (default 8080)
EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
