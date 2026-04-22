# Multi-stage build for optimal image size

# Stage 1: Install dependencies using workspace structure
FROM node:18-alpine AS builder
WORKDIR /app

# Copy workspace configuration (including package-lock.json)
COPY package.json package-lock.json ./

# Copy workspace package files
COPY shared-types/package.json ./shared-types/
COPY mcp-server/package.json ./mcp-server/

# Install all dependencies including devDependencies (needed for build)
RUN npm ci && npm cache clean --force

# Stage 2: Build shared types
FROM builder AS shared-types-builder
WORKDIR /app
COPY shared-types/ ./shared-types/
WORKDIR /app/shared-types
RUN npm run build

# Stage 3: Build server
FROM builder AS server-builder
WORKDIR /app

# Copy shared types build
COPY --from=shared-types-builder /app/shared-types /app/shared-types

# Copy server source
COPY mcp-server/ ./mcp-server/

# Build server TypeScript
WORKDIR /app/mcp-server
RUN npm run build

# Stage 4: Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules from builder (includes all workspaces)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules

# Copy workspace-specific node_modules
COPY --from=builder --chown=nodejs:nodejs /app/mcp-server/node_modules /app/node_modules

# Copy shared types build
COPY --from=shared-types-builder --chown=nodejs:nodejs /app/shared-types/dist /app/shared-types/dist
COPY --from=shared-types-builder --chown=nodejs:nodejs /app/shared-types/package.json /app/shared-types/

# Copy server built files
COPY --from=server-builder --chown=nodejs:nodejs /app/mcp-server/dist /app/dist
COPY --from=server-builder --chown=nodejs:nodejs /app/mcp-server/package.json /app/package.json

# Copy SQL schema files (needed for migrations)
COPY --from=server-builder --chown=nodejs:nodejs /app/mcp-server/src/db/*.sql /app/dist/db/

# Switch to non-root user
USER nodejs

# Expose port (use dynamic PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error('Unhealthy')})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
