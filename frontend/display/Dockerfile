# Stage 1: Build
# Build context must be frontend/ (parent of display/) so shared/ is accessible
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared package
COPY shared/ ./shared/

# Copy display package files
COPY display/package.json display/package-lock.json ./display/

# Install display dependencies
WORKDIR /app/display
RUN npm ci

# Symlink shared/node_modules -> display/node_modules
# so TypeScript can resolve imports (e.g. 'react') from within shared/ files
RUN ln -s /app/display/node_modules /app/shared/node_modules

# Copy display source
COPY display/ ./

# Build args for NEXT_PUBLIC_ vars (must be available at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

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
COPY --from=builder --chown=nextjs:nodejs /app/display/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/display/.next/static ./.next/static

USER nextjs

# Cloud Run injects $PORT at runtime (default 8080)
EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
