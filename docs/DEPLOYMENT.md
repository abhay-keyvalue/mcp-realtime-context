# Deployment Guide

This guide covers deploying the MCP Real-Time Context Server to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Render Deployment](#render-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)

---

## Prerequisites

Before deploying, ensure you have:

1. **External PostgreSQL Database**
   - PostgreSQL 12+ recommended
   - Options: Render PostgreSQL, Supabase, AWS RDS, etc.

2. **External Redis Instance**
   - Redis 6+ recommended
   - Options: Upstash, Render Redis, AWS ElastiCache, etc.

3. **Environment Variables Ready**
   - See [Environment Variables](#environment-variables) section

---

## Render Deployment

### Option 1: Using render.yaml (Recommended)

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/yourusername/mcp-realtime-context.git
   cd mcp-realtime-context
   ```

2. **Create Render Account**
   - Sign up at [render.com](https://render.com)

3. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Choose plan (Starter or higher)
   - Note the Internal Database URL

4. **Create Redis Instance**
   - Dashboard → New → Redis
   - Choose plan (Starter or higher)
   - Note the Internal Redis URL

5. **Deploy Web Service**
   - Dashboard → New → Web Service
   - Connect your Git repository
   - Configure:
     - **Environment**: Docker
     - **Dockerfile Path**: `mcp-server/Dockerfile`
     - **Docker Context**: `.`
     - **Port**: 10000 (or use environment variable)

6. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   HOST=0.0.0.0
   DATABASE_URL=<your-postgres-internal-url>
   REDIS_URL=<your-redis-internal-url>
   JWT_SECRET=<generate-secure-random-string>
   JWT_EXPIRES_IN=7d
   LOG_LEVEL=info
   CORS_ORIGIN=*
   ```

7. **Run Database Migrations**
   - After first deploy, open Shell in Render Dashboard
   - Run: `npm run db:migrate`

8. **Verify Deployment**
   ```bash
   curl https://your-app.onrender.com/health
   ```

### Option 2: Using Blueprint (render.yaml)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/mcp-realtime-context.git
   git push -u origin main
   ```

2. **Deploy via Blueprint**
   - Go to Render Dashboard
   - New → Blueprint
   - Connect repository
   - Render will automatically:
     - Create PostgreSQL database
     - Create Redis instance
     - Deploy web service
     - Set up environment variables

3. **Run Migrations**
   ```bash
   # Via Render Shell or locally
   DATABASE_URL=<render-db-url> npm run db:migrate
   ```

---

## Docker Deployment

### Production with Docker Compose

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/mcp-realtime-context.git
   cd mcp-realtime-context
   ```

2. **Set Environment Variables**
   ```bash
   cp mcp-server/.env.example .env
   # Edit .env with your production values
   ```

3. **Build and Start**
   ```bash
   docker-compose up -d
   ```

4. **Run Migrations**
   ```bash
   docker-compose exec mcp-server npm run db:migrate
   ```

5. **Check Health**
   ```bash
   curl http://localhost:3000/health
   ```

### Using Makefile

```bash
# Start production environment
make prod

# View logs
make logs

# Run migrations
make migrate

# Stop services
make down
```

### Single Docker Container

If you have external PostgreSQL and Redis:

```bash
# Build image
docker build -t mcp-server -f mcp-server/Dockerfile .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e REDIS_URL="redis://host:6379" \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  --name mcp-server \
  mcp-server
```

---

## Manual Deployment

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Steps

1. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install shared-types
   cd shared-types
   npm install
   npm run build
   cd ..

   # Install server
   cd mcp-server
   npm install
   ```

2. **Configure Environment**
   ```bash
   cd mcp-server
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Start Server**
   ```bash
   npm start
   ```

### Using PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/index.js --name mcp-server

# Setup auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs mcp-server
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/mcp_context` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT tokens | Use strong random string (32+ chars) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_TIME_WINDOW` | Rate limit window (ms) | `60000` |

### Generating JWT Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### PostgreSQL

#### Render PostgreSQL

1. Create database in Render Dashboard
2. Copy Internal Database URL
3. Use for `DATABASE_URL` environment variable

#### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy connection string (Direct connection / Transaction mode)
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### AWS RDS

1. Create PostgreSQL instance in AWS RDS
2. Configure security group to allow connections
3. Use connection details for `DATABASE_URL`

### Redis

#### Upstash

1. Create database at [upstash.com](https://upstash.com)
2. Copy Redis URL
3. Use for `REDIS_URL` environment variable

#### Render Redis

1. Create Redis instance in Render
2. Copy Internal Redis URL
3. Use for `REDIS_URL`

---

## Post-Deployment

### 1. Run Migrations

```bash
# Using Docker
docker-compose exec mcp-server npm run db:migrate

# Using Render Shell
npm run db:migrate

# Manually
psql $DATABASE_URL < mcp-server/src/db/schema.sql
```

### 2. Create First User

```bash
# Using CLI
npm install -g @mcp/cli
mcp auth register

# Using API
curl -X POST https://your-app.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "name": "Admin User"
  }'
```

### 3. Verify Health

```bash
curl https://your-app.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": true,
    "redis": true,
    "websocket": true
  },
  "uptime": 12345,
  "version": "1.0.0"
}
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check if database exists
psql $DATABASE_URL -c "\l"
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Check Redis info
redis-cli -u $REDIS_URL info
```

### Container Issues

```bash
# View logs
docker-compose logs -f mcp-server

# Check container status
docker-compose ps

# Restart container
docker-compose restart mcp-server
```

### Render Issues

- Check deployment logs in Render Dashboard
- Verify environment variables are set correctly
- Ensure DATABASE_URL and REDIS_URL use internal URLs (not external)
- Check health endpoint: `https://your-app.onrender.com/health`

---

## Scaling

### Horizontal Scaling

The MCP server is stateless and can be horizontally scaled:

1. **Load Balancer**: Use Nginx, HAProxy, or cloud load balancer
2. **Multiple Instances**: Deploy multiple containers/instances
3. **Session Management**: JWT tokens are stateless (no session store needed)
4. **WebSocket**: Use sticky sessions or Redis adapter for WebSocket clustering

### Vertical Scaling

- Increase container resources (CPU/Memory)
- Optimize PostgreSQL connection pool size
- Tune Redis memory limits

---

## Monitoring

### Health Checks

- **Liveness**: `GET /live` (always returns 200 if server is running)
- **Readiness**: `GET /ready` (checks DB and Redis connectivity)
- **Health**: `GET /health` (detailed health status)

### Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs mcp-server

# Render
View logs in Render Dashboard
```

### Metrics

The health endpoint provides:
- Service status (database, redis, websocket)
- Uptime
- WebSocket connection count
- Version info

---

## Security Checklist

- [ ] Use strong JWT secret (32+ random characters)
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Set appropriate CORS_ORIGIN (not `*` in production)
- [ ] Use environment variables (never commit secrets)
- [ ] Enable rate limiting
- [ ] Keep dependencies updated
- [ ] Use PostgreSQL with SSL
- [ ] Use Redis with authentication
- [ ] Restrict database/Redis access by IP
- [ ] Enable container security scanning
- [ ] Set up monitoring and alerts

---

## Support

For issues or questions:
- GitHub Issues: [github.com/yourusername/mcp-realtime-context/issues](https://github.com/yourusername/mcp-realtime-context/issues)
- Documentation: [See docs/](../docs/)
