# 🚀 Quick Start Guide

Get the MCP Real-Time Context Server running in 5 minutes!

## What is This?

A **production-grade system** that enables **real-time shared AI context** across developers during development (pre-commit phase).

- Developer 1 logs work → stored in MCP server
- Developer 2's AI agent fetches it instantly
- Updates available in real-time (no git commit required)

---

## 🏃 Quick Start (Docker)

```bash
# 1. Clone and enter directory
git clone https://github.com/yourusername/mcp-realtime-context.git
cd mcp-realtime-context

# 2. Start everything with Docker Compose
docker-compose up -d

# 3. Wait 30 seconds for services to initialize
sleep 30

# 4. Run database migrations
docker-compose exec mcp-server npm run db:migrate

# 5. Test health
curl http://localhost:3000/health

# 6. Create first user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "name": "Admin User"
  }'
```

**Done!** Server running at `http://localhost:3000`

---

## 🛠️ Development Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/mcp-realtime-context.git
cd mcp-realtime-context

# 2. Start databases only (PostgreSQL + Redis)
docker-compose -f docker-compose.dev.yml up -d

# 3. Install dependencies
npm install
cd shared-types && npm install && npm run build && cd ..
cd mcp-server && npm install && cd ..
cd mcp-cli && npm install && cd ..

# 4. Configure environment
cd mcp-server
cp .env.example .env
# Edit .env if needed (defaults work with Docker)

# 5. Run migrations
npm run db:migrate

# 6. Start server in dev mode
npm run dev
```

**Server running at:** `http://localhost:3000`

---

## 📱 Using the CLI

```bash
# Install CLI globally
cd mcp-cli
npm link

# Or use directly
npm run dev -- --help
```

### First Time Setup

```bash
# 1. Register account
mcp auth register

# 2. Create project
mcp project create

# 3. Select project
mcp project select

# 4. Log your first context
mcp log --smart
? What are you working on? Building user authentication with JWT
```

### Daily Usage

```bash
# View team context
mcp list

# Log what you're working on
mcp log --smart

# View project stats
mcp stats
```

---

## 🔌 API Usage

### Create User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

Returns:
```json
{
  "user": { "id": "...", "email": "user@example.com", "name": "John Doe" },
  "token": "eyJhbGci..."
}
```

### Create Project

```bash
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Project description"
  }'
```

### Log Context (AI-Powered)

```bash
curl -X POST http://localhost:3000/context/smart-create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "input": "Working on fixing API bug that returns 500 errors",
    "author": "John Doe"
  }'
```

### Get Contexts

```bash
curl "http://localhost:3000/context?projectId=YOUR_PROJECT_ID&status=in-progress" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### WebSocket (Real-time)

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/stream?token=YOUR_TOKEN');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Context update:', message);
};
```

---

## 🤖 AI Integration

### Fetch Team Context for AI

```typescript
async function getTeamContext(projectId: string, token: string): Promise<string> {
  const response = await fetch(
    `http://localhost:3000/context?projectId=${projectId}&status=in-progress&limit=10`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const contexts = await response.json();
  
  return contexts.map(ctx => 
    `[${ctx.type}] ${ctx.title}: ${ctx.description}`
  ).join('\n');
}

// Inject into AI prompt
const teamContext = await getTeamContext(projectId, token);
const prompt = `
You are a helpful assistant.

Current team context:
${teamContext}

User question: ${userQuestion}
`;
```

### Log User Work Automatically

```typescript
async function autoLogWork(userMessage: string, projectId: string, author: string, token: string) {
  const workKeywords = ['working on', 'building', 'fixing', 'implementing'];
  
  if (workKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
    await fetch('http://localhost:3000/context/smart-create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        input: userMessage,
        author
      })
    });
  }
}
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f mcp-server

# Stop services
docker-compose down

# Restart server
docker-compose restart mcp-server

# Run migrations
docker-compose exec mcp-server npm run db:migrate

# Open server shell
docker-compose exec mcp-server sh

# Database shell
docker-compose exec postgres psql -U mcp_user -d mcp_context

# Redis CLI
docker-compose exec redis redis-cli
```

---

## 🚀 Deploy to Render

### Option 1: One-Click Deploy

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Blueprint
4. Connect repository
5. Render will use `render.yaml` to deploy everything

### Option 2: Manual Deploy

1. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Copy Internal Database URL

2. **Create Redis Instance**
   - New → Redis
   - Copy Internal Redis URL

3. **Deploy Web Service**
   - New → Web Service
   - Environment: Docker
   - Dockerfile Path: `mcp-server/Dockerfile`
   - Set environment variables:
     ```
     DATABASE_URL=<postgres-internal-url>
     REDIS_URL=<redis-internal-url>
     JWT_SECRET=<random-secure-string>
     PORT=10000
     NODE_ENV=production
     ```

4. **Run Migrations**
   - Open Shell in Render Dashboard
   - Run: `npm run db:migrate`

---

## 📊 Verify Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "healthy",
  "services": {
    "database": true,
    "redis": true,
    "websocket": true
  },
  "uptime": 12345,
  "version": "1.0.0"
}
```

### Test Flow

1. **Register user** → Get token
2. **Create project** → Get project ID
3. **Log context** → Verify created
4. **Query contexts** → See your context
5. **Check stats** → View statistics

---

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[CLI Documentation](docs/CLI.md)** - CLI usage guide
- **[Setup Guide](docs/SETUP.md)** - Detailed setup instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[AI Integration](docs/AI_INTEGRATION.md)** - Integrate with AI agents

---

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

---

## 🎯 Use Cases

### 1. Team Awareness
Developers see what teammates are working on in real-time

### 2. AI Context
AI agents have access to current team context for better assistance

### 3. Decision Tracking
Track architectural decisions and technical choices

### 4. WIP Visibility
See all work-in-progress across the team

### 5. Bug Tracking
Track bugs being fixed in real-time

---

## ⚡ Key Features

- ✅ **Real-time WebSocket updates**
- ✅ **AI-powered context detection**
- ✅ **Auto-tagging and categorization**
- ✅ **Version tracking**
- ✅ **Multi-project support**
- ✅ **Role-based access control**
- ✅ **Production-ready (Docker, monitoring, security)**
- ✅ **CLI tool included**
- ✅ **Complete TypeScript codebase**
- ✅ **PostgreSQL with connection pooling**
- ✅ **Redis pub/sub**
- ✅ **JWT authentication**
- ✅ **Rate limiting**
- ✅ **Health checks**

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL 15
- **Cache/PubSub**: Redis 7
- **Real-time**: WebSocket (ws)
- **Security**: JWT, bcrypt
- **Validation**: Zod
- **Logging**: Pino
- **Container**: Docker, Docker Compose

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check Docker services
docker-compose ps

# View logs
docker-compose logs

# Restart everything
docker-compose restart
```

### Database Connection Failed

```bash
# Test connection
psql postgresql://mcp_user:mcp_password@localhost:5432/mcp_context

# Restart PostgreSQL
docker-compose restart postgres
```

### Port 3000 Already in Use

```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or change PORT in .env
```

---

## 📦 What's Included

```
mcp-realtime-context/
├── mcp-server/          # Backend API (Fastify)
├── mcp-cli/             # CLI tool
├── shared-types/        # Shared TypeScript types
├── docs/                # Complete documentation
├── docker-compose.yml   # Production Docker
├── Dockerfile          # Server container
├── Makefile           # Convenience commands
└── render.yaml        # Render deployment
```

---

## 🎓 Next Steps

1. ✅ **Complete Quick Start above**
2. 📖 **Read [API Documentation](docs/API.md)**
3. 🤖 **Integrate with AI** - See [AI Integration Guide](docs/AI_INTEGRATION.md)
4. 🚀 **Deploy to production** - See [Deployment Guide](docs/DEPLOYMENT.md)
5. 🔧 **Customize for your team**

---

## 💡 Example Workflows

### Morning Standup

```bash
# See what team worked on yesterday
mcp list --limit 20

# See current in-progress work
mcp list --status in-progress
```

### Starting New Work

```bash
# Log what you're starting
mcp log --smart
? What are you working on? Building payment integration with Stripe
```

### AI Assistant

Your AI can now access team context:

```
AI: I see your team is working on:
- Payment integration (John)
- User authentication (Jane)
- API bug fixes (Bob)

How can I help with your task?
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT License - See LICENSE file

---

## 🆘 Support

- **Documentation**: See `docs/` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/mcp-realtime-context/issues)
- **Health**: `http://localhost:3000/health`

---

**Built with ❤️ for developers who want smarter AI context**
