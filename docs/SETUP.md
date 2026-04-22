# Setup Guide

Complete setup instructions for the MCP Real-Time Context Server.

## Quick Start (Docker)

The fastest way to get started:

```bash
# 1. Clone repository
git clone https://github.com/yourusername/mcp-realtime-context.git
cd mcp-realtime-context

# 2. Start development databases
make dev

# 3. Install dependencies
make install

# 4. Run database migrations
cd mcp-server
npm run db:migrate

# 5. Start server in development mode
npm run dev

# 6. In another terminal, test the CLI
cd ../mcp-cli
npm run dev auth register
```

Server will be running at `http://localhost:3000`

---

## Detailed Setup

### Prerequisites

- **Node.js**: 18+ ([nodejs.org](https://nodejs.org))
- **Docker**: Latest ([docker.com](https://docker.com))
- **PostgreSQL**: 12+ (or use Docker)
- **Redis**: 6+ (or use Docker)
- **Make**: For convenient commands (optional)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/mcp-realtime-context.git
cd mcp-realtime-context
```

### Step 2: Choose Setup Method

You have three options:

#### Option A: Full Docker (Recommended for Production)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f mcp-server
```

#### Option B: Docker for Databases Only (Recommended for Development)

```bash
# Start databases only
docker-compose -f docker-compose.dev.yml up -d

# Verify databases are running
docker-compose -f docker-compose.dev.yml ps
```

Then continue with local server setup below.

#### Option C: Manual Setup (No Docker)

Install PostgreSQL and Redis locally, then continue with setup below.

### Step 3: Install Dependencies

```bash
# Install all dependencies
make install

# Or manually:
cd shared-types && npm install && cd ..
cd mcp-server && npm install && cd ..
cd mcp-cli && npm install && cd ..
```

### Step 4: Configure Environment

```bash
cd mcp-server
cp .env.example .env
```

Edit `.env`:

```bash
# Development
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database (if using Docker)
DATABASE_URL=postgresql://mcp_user:mcp_password@localhost:5432/mcp_context

# Redis (if using Docker)
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-key-change-in-production

# Optional
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
CORS_ORIGIN=*
```

**Generate JWT Secret:**

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 5: Build TypeScript

```bash
# Build all packages
make build-ts

# Or manually:
cd shared-types && npm run build && cd ..
cd mcp-server && npm run build && cd ..
cd mcp-cli && npm run build && cd ..
```

### Step 6: Run Database Migrations

```bash
cd mcp-server

# Run migrations
npm run db:migrate

# Or directly with psql
psql $DATABASE_URL < src/db/schema.sql
```

Expected output:
```
🔄 Running database migrations...
✅ Database migrations completed successfully
```

### Step 7: Start Server

**Development:**

```bash
cd mcp-server
npm run dev
```

**Production:**

```bash
cd mcp-server
npm start
```

You should see:

```
╔═══════════════════════════════════════════════════╗
║  🚀 MCP Real-Time Context Server                 ║
║                                                   ║
║  Server running at: http://0.0.0.0:3000          ║
║  Environment: development                         ║
║  WebSocket: ws://0.0.0.0:3000/ws/stream          ║
╚═══════════════════════════════════════════════════╝
```

### Step 8: Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "database": true,
#     "redis": true,
#     "websocket": true
#   },
#   ...
# }
```

### Step 9: Setup CLI (Optional)

```bash
cd mcp-cli

# Link CLI globally
npm link

# Or use directly
npm run dev -- --help
```

Now you can use the `mcp` command:

```bash
mcp --help
```

---

## First Time Usage

### 1. Create User Account

**Via CLI:**

```bash
mcp auth register
```

**Via API:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'
```

### 2. Create Project

**Via CLI:**

```bash
mcp project create
```

**Via API:**

```bash
# First, login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'

# Use token to create project
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "Getting started with MCP"
  }'
```

### 3. Log First Context

**Via CLI:**

```bash
mcp log --smart
```

**Via API:**

```bash
curl -X POST http://localhost:3000/context/smart-create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "input": "Working on setting up the MCP context server",
    "author": "John Doe"
  }'
```

### 4. View Contexts

**Via CLI:**

```bash
mcp list
```

**Via API:**

```bash
curl http://localhost:3000/context?projectId=YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Development Workflow

### Running Services

```bash
# Terminal 1: Start databases
make dev

# Terminal 2: Start server in watch mode
cd mcp-server
npm run dev

# Terminal 3: Use CLI
mcp log --smart
```

### Making Changes

1. Edit TypeScript files in `src/`
2. Changes auto-reload (if using `npm run dev`)
3. Test with CLI or API calls

### Database Changes

1. Edit `src/db/schema.sql`
2. Run migrations:
   ```bash
   npm run db:migrate
   ```

### Adding New Routes

1. Create route file in `src/routes/`
2. Register in `src/index.ts`:
   ```typescript
   await fastify.register(myRoute, { prefix: '/my-route' });
   ```

---

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

Quick options:
- **Render**: One-click deploy with `render.yaml`
- **Docker**: Use `docker-compose.yml`
- **Manual**: Build and run with Node.js

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection string |
| `REDIS_URL` | **Yes** | - | Redis connection string |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration time |
| `LOG_LEVEL` | No | `info` | Log level (debug, info, warn, error) |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per time window |
| `RATE_LIMIT_TIME_WINDOW` | No | `60000` | Rate limit window (ms) |

### Database Connection Formats

**PostgreSQL:**
```
postgresql://username:password@host:port/database
postgresql://username:password@host:port/database?ssl=true
```

**Redis:**
```
redis://host:port
redis://:password@host:port
rediss://host:port (SSL)
```

---

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql postgresql://mcp_user:mcp_password@localhost:5432/mcp_context

# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Redis Connection Failed

```bash
# Test connection
redis-cli -h localhost -p 6379 ping

# Check if Redis is running
docker-compose ps redis

# View Redis logs
docker-compose logs redis
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

### Migration Errors

```bash
# Drop all tables and re-run
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:migrate
```

### TypeScript Build Errors

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### CLI Not Found

```bash
# Re-link CLI
cd mcp-cli
npm link

# Or use full path
./node_modules/.bin/mcp --help
```

---

## Useful Commands

### Make Commands

```bash
make help           # Show all commands
make dev            # Start dev databases
make prod           # Build and start production
make logs           # View server logs
make migrate        # Run database migrations
make clean          # Clean up everything
make shell          # Open shell in container
make db-shell       # Open PostgreSQL shell
make redis-cli      # Open Redis CLI
make health         # Check server health
```

### Docker Commands

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart service
docker-compose restart mcp-server

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

### Database Commands

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U mcp_user -d mcp_context

# Run SQL file
psql $DATABASE_URL < file.sql

# Dump database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Redis Commands

```bash
# Redis CLI
docker-compose exec redis redis-cli

# View all keys
redis-cli KEYS '*'

# Clear cache
redis-cli FLUSHALL
```

---

## Next Steps

1. ✅ Setup complete!
2. 📖 Read [API Documentation](./API.md)
3. 🔧 Read [CLI Documentation](./CLI.md)
4. 🤖 Read [AI Integration Guide](./AI_INTEGRATION.md)
5. 🚀 Read [Deployment Guide](./DEPLOYMENT.md)

---

## Getting Help

- **Documentation**: See `docs/` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/mcp-realtime-context/issues)
- **Health Check**: `http://localhost:3000/health`
- **API Root**: `http://localhost:3000/`

---

## Project Structure

```
mcp-realtime-context/
├── mcp-server/           # Backend server
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── db/           # Database (schema, pool)
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── plugins/      # Fastify plugins
│   │   └── index.ts      # Entry point
│   ├── Dockerfile
│   └── package.json
├── mcp-cli/              # CLI tool
│   ├── src/
│   │   ├── commands/     # CLI commands
│   │   ├── api.ts        # API client
│   │   └── index.ts      # Entry point
│   └── package.json
├── shared-types/         # Shared TypeScript types
│   ├── src/
│   │   ├── types.ts      # Type definitions
│   │   ├── schemas.ts    # Zod schemas
│   │   └── validators.ts # Validation functions
│   └── package.json
├── docs/                 # Documentation
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── Makefile             # Convenience commands
└── README.md            # Main documentation
```

---

## License

MIT License - See LICENSE file for details
