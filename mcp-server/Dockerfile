# Multi-stage build for optimal image size

# Stage 1: Build shared types
FROM node:18-alpine AS shared-types-builder
WORKDIR /app/shared-types
COPY shared-types/package*.json ./
RUN npm ci --only=production
COPY shared-types/ ./
RUN npm run build

# Stage 2: Build server
FROM node:18-alpine AS server-builder
WORKDIR /app

# Copy shared types build
COPY --from=shared-types-builder /app/shared-types /app/shared-types

# Copy server package files
COPY mcp-server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy server source
COPY mcp-server/ ./

# Build TypeScript
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy shared types from builder
COPY --from=shared-types-builder /app/shared-types/dist /app/node_modules/@mcp/shared-types/dist
COPY --from=shared-types-builder /app/shared-types/package.json /app/node_modules/@mcp/shared-types/

# Copy node_modules and built files from server builder
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/dist /app/dist
COPY --from=server-builder --chown=nodejs:nodejs /app/package.json /app/

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
