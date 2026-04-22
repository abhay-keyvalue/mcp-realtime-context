# AI Integration Guide

Guide for integrating the MCP Context Server with AI agents and assistants.

## Overview

The MCP server enables AI agents to:
1. **Read** current team context before generating responses
2. **Write** context when users describe their work
3. **Stream** real-time updates via WebSocket

This allows AI to provide context-aware assistance based on what the team is actively working on.

---

## Integration Patterns

### Pattern 1: Pre-Prompt Context Injection

Fetch relevant context before generating AI responses.

```typescript
async function getContextForAI(projectId: string): Promise<string> {
  const response = await fetch(`${MCP_SERVER}/context?projectId=${projectId}&status=in-progress&limit=20`, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  });
  
  const contexts = await response.json();
  
  const contextText = contexts.map(ctx => 
    `[${ctx.type.toUpperCase()}] ${ctx.title}\n${ctx.description}\nAuthor: ${ctx.author}\nTags: ${ctx.tags.join(', ')}`
  ).join('\n\n');
  
  return contextText;
}

// Use in AI prompt
const teamContext = await getContextForAI(projectId);
const prompt = `
You are a helpful assistant.

Current team context:
${teamContext}

User question: ${userQuestion}

Provide a response that takes into account what the team is currently working on.
`;
```

---

### Pattern 2: Auto-Logging User Work

Detect when user describes their work and automatically log it.

```typescript
async function detectAndLogWork(userMessage: string, projectId: string, author: string) {
  // Keywords that indicate user is describing work
  const workIndicators = [
    'working on',
    'building',
    'fixing',
    'implementing',
    'adding',
    'creating',
    'developing',
    'debugging',
  ];
  
  const isWorkDescription = workIndicators.some(indicator => 
    userMessage.toLowerCase().includes(indicator)
  );
  
  if (isWorkDescription) {
    // Use smart-create endpoint
    await fetch(`${MCP_SERVER}/context/smart-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
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

### Pattern 3: Real-Time Context Updates

Subscribe to context updates for live awareness.

```typescript
function subscribeToContextUpdates(projectId: string, onUpdate: (context: any) => void) {
  const ws = new WebSocket(`${WS_SERVER}/ws/stream?token=${JWT_TOKEN}`);
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.eventType === 'created' || message.eventType === 'updated') {
      if (message.context.projectId === projectId) {
        onUpdate(message.context);
      }
    }
  };
  
  return ws;
}

// Usage
subscribeToContextUpdates(projectId, (context) => {
  console.log('New context:', context.title);
  // Update AI knowledge base, notify user, etc.
});
```

---

## Cursor Integration Example

### Setup

```typescript
// config.ts
export const MCP_CONFIG = {
  serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
  token: process.env.MCP_TOKEN,
  projectId: process.env.MCP_PROJECT_ID,
};
```

### Pre-Request Hook

Fetch context before AI generates response.

```typescript
// hooks/pre-request.ts
import { MCP_CONFIG } from './config';

export async function preRequestHook(userQuery: string): Promise<string> {
  try {
    const response = await fetch(
      `${MCP_CONFIG.serverUrl}/context?projectId=${MCP_CONFIG.projectId}&status=in-progress&limit=15`,
      {
        headers: {
          'Authorization': `Bearer ${MCP_CONFIG.token}`
        }
      }
    );
    
    if (!response.ok) {
      return '';
    }
    
    const contexts = await response.json();
    
    if (contexts.length === 0) {
      return '';
    }
    
    const contextSummary = contexts.map(ctx => {
      const emoji = {
        api: '🔌',
        feature: '✨',
        decision: '🤔',
        wip: '🚧',
        bug: '🐛'
      }[ctx.type] || '📝';
      
      return `${emoji} ${ctx.title} (${ctx.author})`;
    }).join('\n');
    
    return `\n\n## Team Context\n\nYour team is currently working on:\n${contextSummary}\n\nTake this into account when providing assistance.\n`;
    
  } catch (error) {
    console.error('Failed to fetch MCP context:', error);
    return '';
  }
}
```

### Post-Response Hook

Log user work after AI interaction.

```typescript
// hooks/post-response.ts
import { MCP_CONFIG } from './config';

export async function postResponseHook(
  userMessage: string,
  aiResponse: string,
  author: string
): Promise<void> {
  const workKeywords = [
    'working on',
    'building',
    'implementing',
    'fixing',
    'creating',
    'debugging',
    'refactoring',
  ];
  
  const mentionsWork = workKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
  
  if (!mentionsWork) {
    return;
  }
  
  try {
    await fetch(`${MCP_CONFIG.serverUrl}/context/smart-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MCP_CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: MCP_CONFIG.projectId,
        input: userMessage,
        author
      })
    });
  } catch (error) {
    console.error('Failed to log context:', error);
  }
}
```

---

## OpenAI Assistant Integration

### Function Calling

Define MCP context functions for OpenAI Assistant.

```typescript
const functions = [
  {
    name: 'get_team_context',
    description: 'Get current team context and what they are working on',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['api', 'feature', 'decision', 'wip', 'bug'],
          description: 'Filter by context type'
        },
        status: {
          type: 'string',
          enum: ['draft', 'in-progress', 'finalized'],
          description: 'Filter by status'
        },
        limit: {
          type: 'number',
          description: 'Max results to return'
        }
      },
      required: []
    }
  },
  {
    name: 'log_work_context',
    description: 'Log what the user is currently working on',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of the work'
        },
        type: {
          type: 'string',
          enum: ['api', 'feature', 'decision', 'wip', 'bug'],
          description: 'Type of work'
        }
      },
      required: ['description']
    }
  }
];
```

### Function Implementations

```typescript
async function getTeamContext(params: any): Promise<string> {
  const queryParams = new URLSearchParams({
    projectId: MCP_CONFIG.projectId,
    ...(params.type && { type: params.type }),
    ...(params.status && { status: params.status }),
    limit: params.limit || '20'
  });
  
  const response = await fetch(
    `${MCP_CONFIG.serverUrl}/context?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${MCP_CONFIG.token}`
      }
    }
  );
  
  const contexts = await response.json();
  return JSON.stringify(contexts, null, 2);
}

async function logWorkContext(params: any): Promise<string> {
  const response = await fetch(
    `${MCP_CONFIG.serverUrl}/context/smart-create`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MCP_CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: MCP_CONFIG.projectId,
        input: params.description,
        author: 'AI Assistant'
      })
    }
  );
  
  const result = await response.json();
  return `Logged context: ${result.context.title}`;
}
```

---

## Claude Integration

### System Prompt Enhancement

```typescript
async function getEnhancedSystemPrompt(basePrompt: string): Promise<string> {
  const teamContext = await getContextForAI(MCP_CONFIG.projectId);
  
  return `${basePrompt}

## Current Team Context

Your team members are currently working on:

${teamContext}

When providing assistance:
1. Consider ongoing work to avoid conflicts
2. Reference related context when relevant
3. Suggest complementary approaches
4. Alert if work might overlap with existing efforts
`;
}
```

---

## Best Practices

### 1. Context Relevance

Filter contexts by:
- **Status**: Focus on `in-progress` for active work
- **Time**: Recent updates (last 24-48 hours)
- **Type**: Relevant to current task

```typescript
async function getRelevantContext(query: string): Promise<Context[]> {
  // Base filters
  let filters = {
    projectId: MCP_CONFIG.projectId,
    status: 'in-progress',
    limit: 20
  };
  
  // Detect query type
  if (query.toLowerCase().includes('api') || query.toLowerCase().includes('endpoint')) {
    filters.type = 'api';
  } else if (query.toLowerCase().includes('bug') || query.toLowerCase().includes('fix')) {
    filters.type = 'bug';
  }
  
  const response = await fetch(
    `${MCP_CONFIG.serverUrl}/context?${new URLSearchParams(filters)}`,
    {
      headers: {
        'Authorization': `Bearer ${MCP_CONFIG.token}`
      }
    }
  );
  
  return await response.json();
}
```

### 2. Confidence Scoring

Use confidence scores to prioritize context.

```typescript
function prioritizeContexts(contexts: Context[]): Context[] {
  return contexts
    .filter(ctx => ctx.confidence >= 60)
    .sort((a, b) => {
      // Prioritize by confidence and recency
      const scoreA = a.confidence + (Date.now() - new Date(a.updatedAt).getTime()) / 1000000;
      const scoreB = b.confidence + (Date.now() - new Date(b.updatedAt).getTime()) / 1000000;
      return scoreB - scoreA;
    })
    .slice(0, 10);
}
```

### 3. Smart Logging

Only log meaningful work descriptions.

```typescript
function shouldLogContext(message: string): boolean {
  // Minimum length
  if (message.length < 20) return false;
  
  // Must contain work indicators
  const workKeywords = [
    'working on', 'building', 'implementing', 'fixing',
    'creating', 'developing', 'debugging', 'refactoring'
  ];
  
  const hasWorkKeyword = workKeywords.some(kw => 
    message.toLowerCase().includes(kw)
  );
  
  // Must not be a question
  const isQuestion = message.trim().endsWith('?');
  
  return hasWorkKeyword && !isQuestion;
}
```

### 4. Rate Limiting

Avoid overwhelming the API.

```typescript
class ContextManager {
  private lastFetch: number = 0;
  private cacheTime: number = 60000; // 1 minute
  private cache: Context[] = [];
  
  async getContext(): Promise<Context[]> {
    const now = Date.now();
    
    if (now - this.lastFetch < this.cacheTime) {
      return this.cache;
    }
    
    this.cache = await this.fetchContext();
    this.lastFetch = now;
    
    return this.cache;
  }
  
  private async fetchContext(): Promise<Context[]> {
    // Actual API call
  }
}
```

---

## Example: Full Integration

Complete example with caching, filtering, and logging.

```typescript
import WebSocket from 'ws';

class MCPContextIntegration {
  private serverUrl: string;
  private token: string;
  private projectId: string;
  private ws?: WebSocket;
  private contextCache: Context[] = [];
  private lastFetch: number = 0;
  
  constructor(config: MCPConfig) {
    this.serverUrl = config.serverUrl;
    this.token = config.token;
    this.projectId = config.projectId;
    this.initWebSocket();
  }
  
  private initWebSocket(): void {
    const wsUrl = this.serverUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws/stream?token=${this.token}`);
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.eventType === 'created' || message.eventType === 'updated') {
        this.handleContextUpdate(message.context);
      }
    });
  }
  
  private handleContextUpdate(context: Context): void {
    // Update cache
    const index = this.contextCache.findIndex(c => c.id === context.id);
    if (index >= 0) {
      this.contextCache[index] = context;
    } else {
      this.contextCache.push(context);
    }
  }
  
  async getRelevantContext(query: string): Promise<string> {
    const now = Date.now();
    
    // Fetch fresh data every minute
    if (now - this.lastFetch > 60000) {
      await this.refreshContext();
    }
    
    const relevant = this.contextCache
      .filter(ctx => ctx.status === 'in-progress')
      .filter(ctx => ctx.confidence >= 60)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    
    return this.formatContextForAI(relevant);
  }
  
  private async refreshContext(): Promise<void> {
    const response = await fetch(
      `${this.serverUrl}/context?projectId=${this.projectId}&status=in-progress&limit=50`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    
    this.contextCache = await response.json();
    this.lastFetch = Date.now();
  }
  
  private formatContextForAI(contexts: Context[]): string {
    if (contexts.length === 0) {
      return 'No active team context available.';
    }
    
    return contexts.map(ctx => {
      return `[${ctx.type.toUpperCase()}] ${ctx.title}\n` +
             `${ctx.description}\n` +
             `Author: ${ctx.author} | Confidence: ${ctx.confidence}%\n` +
             `Tags: ${ctx.tags.join(', ')}`;
    }).join('\n\n');
  }
  
  async logUserWork(message: string, author: string): Promise<void> {
    if (!this.shouldLog(message)) {
      return;
    }
    
    await fetch(`${this.serverUrl}/context/smart-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: this.projectId,
        input: message,
        author
      })
    });
  }
  
  private shouldLog(message: string): boolean {
    const workKeywords = ['working on', 'building', 'implementing', 'fixing'];
    return workKeywords.some(kw => message.toLowerCase().includes(kw)) &&
           !message.trim().endsWith('?') &&
           message.length >= 20;
  }
}

// Usage
const mcp = new MCPContextIntegration({
  serverUrl: process.env.MCP_SERVER_URL!,
  token: process.env.MCP_TOKEN!,
  projectId: process.env.MCP_PROJECT_ID!
});

// In AI prompt handler
const teamContext = await mcp.getRelevantContext(userQuery);
const prompt = `${basePrompt}\n\nTeam Context:\n${teamContext}\n\nUser: ${userQuery}`;

// After user describes work
await mcp.logUserWork(userMessage, userName);
```

---

## Testing

Test your AI integration:

```typescript
// Test context fetching
const context = await mcp.getRelevantContext('How do I implement auth?');
console.log('Context:', context);

// Test logging
await mcp.logUserWork('Working on implementing OAuth2 login', 'John Doe');

// Verify logged
const contexts = await fetch(`${MCP_SERVER}/context?projectId=${PROJECT_ID}`, {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
});
console.log('Logged contexts:', await contexts.json());
```

---

## Troubleshooting

### Context Not Appearing

1. Verify project ID is correct
2. Check authentication token
3. Ensure contexts have correct status
4. Clear cache and refresh

### Too Much Context

- Filter by type
- Limit results
- Increase confidence threshold
- Filter by time (recent updates only)

### WebSocket Disconnects

- Implement reconnection logic
- Handle connection errors
- Use ping/pong to keep alive

---

## Next Steps

1. Implement basic context fetching
2. Add logging for user work
3. Set up WebSocket for real-time updates
4. Fine-tune filters and relevance
5. Add caching and optimization
6. Monitor usage and iterate
