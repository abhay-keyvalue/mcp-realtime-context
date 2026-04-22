# API Documentation

Complete API reference for MCP Real-Time Context Server.

Base URL: `http://localhost:3000` (development)

## Table of Contents

- [Authentication](#authentication)
- [Projects](#projects)
- [Context](#context)
- [WebSocket](#websocket)
- [Health](#health)

---

## Authentication

### Register

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "developer"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "developer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "developer",
    "projectIds": ["project-uuid-1", "project-uuid-2"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Get Current User

Get authenticated user information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "developer",
  "projectIds": ["project-uuid-1"]
}
```

---

## Projects

### Create Project

**Endpoint:** `POST /projects`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "My Project",
  "description": "Project description"
}
```

**Response:** `201 Created`
```json
{
  "id": "project-uuid",
  "name": "My Project",
  "description": "Project description",
  "ownerId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### List Projects

Get all projects for authenticated user.

**Endpoint:** `GET /projects`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "project-uuid",
    "name": "My Project",
    "description": "Project description",
    "ownerId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### Get Project

**Endpoint:** `GET /projects/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "project-uuid",
  "name": "My Project",
  "description": "Project description",
  "ownerId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Context

### Create/Update Context

Add or update context information.

**Endpoint:** `POST /context/update`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "projectId": "project-uuid",
  "type": "feature",
  "title": "User Authentication",
  "description": "Implementing JWT-based authentication with refresh tokens",
  "status": "in-progress",
  "tags": ["auth", "security", "jwt"],
  "author": "John Doe",
  "source": "cli",
  "confidence": 85,
  "metadata": {
    "relatedFiles": ["src/auth/", "src/middleware/"]
  },
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "context-uuid",
  "projectId": "project-uuid",
  "type": "feature",
  "title": "User Authentication",
  "description": "Implementing JWT-based authentication with refresh tokens",
  "status": "in-progress",
  "tags": ["auth", "security", "jwt"],
  "author": "John Doe",
  "source": "cli",
  "confidence": 85,
  "version": 1,
  "metadata": {
    "relatedFiles": ["src/auth/", "src/middleware/"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

---

### Smart Create (AI-Powered)

Create context with automatic type detection and tagging.

**Endpoint:** `POST /context/smart-create`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "projectId": "project-uuid",
  "input": "Working on fixing a bug in the API endpoint that returns 500 errors when user email is missing",
  "author": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "context": {
    "id": "context-uuid",
    "projectId": "project-uuid",
    "type": "bug",
    "title": "Working on fixing a bug in the API endpoint that returns 500 errors",
    "description": "Working on fixing a bug in the API endpoint that returns 500 errors when user email is missing",
    "status": "draft",
    "tags": ["api", "bug"],
    "author": "John Doe",
    "source": "ai",
    "confidence": 75,
    "version": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "normalized": {
    "detectedType": "bug",
    "extractedTags": ["api", "bug"],
    "confidence": 75
  }
}
```

---

### Query Contexts

Get contexts with filters.

**Endpoint:** `GET /context`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` (string, optional): Filter by project
- `type` (string | array, optional): Filter by type(s)
- `status` (string | array, optional): Filter by status(es)
- `tags` (array, optional): Filter by tags
- `author` (string, optional): Filter by author
- `source` (string, optional): Filter by source
- `minConfidence` (number, optional): Minimum confidence score
- `limit` (number, optional): Max results (default: 50)
- `offset` (number, optional): Pagination offset
- `sortBy` (string, optional): Sort field (createdAt, updatedAt, confidence)
- `sortOrder` (string, optional): asc | desc

**Example:**
```
GET /context?projectId=project-uuid&type=wip&status=in-progress&limit=10
```

**Response:** `200 OK`
```json
[
  {
    "id": "context-uuid",
    "projectId": "project-uuid",
    "type": "wip",
    "title": "User Authentication",
    "description": "Implementing JWT-based authentication",
    "status": "in-progress",
    "tags": ["auth", "security"],
    "author": "John Doe",
    "source": "cli",
    "confidence": 85,
    "version": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### Get Single Context

**Endpoint:** `GET /context/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "context-uuid",
  "projectId": "project-uuid",
  "type": "feature",
  "title": "User Authentication",
  "description": "Implementing JWT-based authentication",
  "status": "in-progress",
  "tags": ["auth", "security"],
  "author": "John Doe",
  "source": "cli",
  "confidence": 85,
  "version": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Update Context

**Endpoint:** `PATCH /context/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "finalized",
  "confidence": 95,
  "tags": ["auth", "security", "jwt"]
}
```

**Response:** `200 OK`
```json
{
  "id": "context-uuid",
  "projectId": "project-uuid",
  "type": "feature",
  "title": "User Authentication",
  "description": "Implementing JWT-based authentication",
  "status": "finalized",
  "tags": ["auth", "security", "jwt"],
  "confidence": 95,
  "version": 2,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:10:00.000Z"
}
```

---

### Delete Context

**Endpoint:** `DELETE /context/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

### Get Statistics

**Endpoint:** `GET /context/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` (string, optional): Filter by project

**Response:** `200 OK`
```json
{
  "total": 42,
  "byType": {
    "api": 8,
    "feature": 15,
    "decision": 5,
    "wip": 12,
    "bug": 2
  },
  "byStatus": {
    "draft": 5,
    "in-progress": 20,
    "finalized": 17
  },
  "activeAuthors": 3,
  "recentUpdates": 8
}
```

---

## WebSocket

### Connect to Stream

Real-time context updates via WebSocket.

**Endpoint:** `ws://localhost:3000/ws/stream?token=<jwt-token>`

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/stream?token=YOUR_JWT_TOKEN');

ws.onopen = () => {
  console.log('Connected to MCP Context Stream');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

**Welcome Message:**
```json
{
  "type": "connected",
  "payload": {
    "clientId": "client-uuid",
    "message": "Connected to MCP Context Stream",
    "projectIds": ["project-uuid-1", "project-uuid-2"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Context Event Messages:**
```json
{
  "eventType": "created",
  "context": {
    "id": "context-uuid",
    "projectId": "project-uuid",
    "type": "feature",
    "title": "New Feature",
    "description": "Feature description",
    "status": "draft",
    "tags": [],
    "author": "John Doe",
    "source": "ai",
    "confidence": 75,
    "version": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Ping/Pong:**
```javascript
// Send ping
ws.send(JSON.stringify({ type: 'ping' }));

// Receive pong
{
  "type": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Health

### Health Check

**Endpoint:** `GET /health`

**Response:** `200 OK` (or `503 Service Unavailable`)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": true,
    "redis": true,
    "websocket": true
  },
  "uptime": 123456,
  "version": "1.0.0",
  "websocketConnections": 5
}
```

---

### Readiness

**Endpoint:** `GET /ready`

**Response:** `200 OK` or `503 Service Unavailable`
```json
{
  "ready": true
}
```

---

### Liveness

**Endpoint:** `GET /live`

**Response:** `200 OK`
```json
{
  "alive": true
}
```

---

## Error Responses

### Error Format

```json
{
  "error": "Error message description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

Default: 100 requests per minute per IP

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**Rate Limit Error:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```
