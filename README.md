# MCP Real-Time Context Server

A production-grade Model Context Protocol (MCP) server system that enables real-time shared AI context across developers during development (pre-commit phase).

## 🎯 Features

- **Real-time Context Sharing**: Developers can log work via AI or CLI, instantly accessible to teammates
- **WebSocket Updates**: Live context updates without git commits
- **Structured Context**: API, feature, decision, WIP, and bug tracking
- **AI Integration Ready**: Built for seamless AI agent integration
- **Production Ready**: Dockerized, secure, and optimized for deployment

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Dev 1     │──────▶│  MCP Server  │◀─────│   Dev 2     │
│  (CLI/AI)   │      │  (Fastify)   │      │  (AI Agent) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
              ┌─────▼────┐    ┌─────▼────┐
              │PostgreSQL│    │  Redis   │
              └──────────┘    └──────────┘
```

## 📦 Components

- **mcp-server**: Backend API server (Node.js + Fastify)
- **mcp-cli**: Command-line tool for logging context
- **shared-types**: Shared TypeScript types and schemas
- **docker**: Docker configuration files
- **docs**: Documentation and guides

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (external or Docker)
- Redis (external or Docker)

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and Redis credentials

# Run with Docker Compose
docker-compose up

# Or run locally
npm run dev
```

### Docker Deployment

```bash
# Build image
docker build -t mcp-server .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e JWT_SECRET="your-secret" \
  mcp-server
```

### Render Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed Render deployment instructions.

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [CLI Usage](./docs/CLI.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [AI Integration](./docs/AI_INTEGRATION.md)

## 🔒 Security

- JWT authentication
- Role-based access control
- Multi-project support
- Rate limiting

## 📊 API Endpoints

- `POST /context/update` - Add or update context
- `GET /context` - Query context with filters
- `GET /context/stream` - WebSocket real-time updates
- `GET /health` - Health check
- `POST /auth/login` - Authentication

## 🛠️ Tech Stack

- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL with connection pooling
- **Cache/PubSub**: Redis
- **Real-time**: WebSocket (ws library)
- **Security**: JWT, bcrypt
- **Logging**: Pino
- **Validation**: Zod

## 📝 License

MIT
