.PHONY: help build up down logs clean migrate dev prod

help:
	@echo "MCP Real-Time Context Server - Make Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment (databases only)"
	@echo "  make dev-server   - Run server locally in dev mode"
	@echo ""
	@echo "Production:"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make prod         - Build and start in production mode"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs         - View logs"
	@echo "  make migrate      - Run database migrations"
	@echo "  make clean        - Clean up containers and volumes"
	@echo "  make shell        - Open shell in server container"
	@echo ""

# Development
dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development databases started"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"

dev-server:
	cd mcp-server && npm run dev

# Production
build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ Services started"
	@echo "Server: http://localhost:3000"
	@echo "WebSocket: ws://localhost:3000/ws/stream"

down:
	docker-compose down

prod: build up
	@echo "✅ Production environment running"

# Utilities
logs:
	docker-compose logs -f mcp-server

logs-all:
	docker-compose logs -f

migrate:
	docker-compose exec mcp-server npm run db:migrate

shell:
	docker-compose exec mcp-server sh

clean:
	docker-compose down -v
	docker system prune -f

# Database
db-shell:
	docker-compose exec postgres psql -U mcp_user -d mcp_context

redis-cli:
	docker-compose exec redis redis-cli

# Health check
health:
	@curl -s http://localhost:3000/health | jq .

# Install dependencies
install:
	cd shared-types && npm install
	cd mcp-server && npm install
	cd mcp-cli && npm install
	@echo "✅ Dependencies installed"

# Build all TypeScript
build-ts:
	cd shared-types && npm run build
	cd mcp-server && npm run build
	cd mcp-cli && npm run build
	@echo "✅ TypeScript compiled"
