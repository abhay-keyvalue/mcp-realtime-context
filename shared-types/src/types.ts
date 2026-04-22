export type ContextType = 'api' | 'feature' | 'decision' | 'wip' | 'bug';

export type ContextStatus = 'draft' | 'in-progress' | 'finalized' | 'archived';

export type ContextSource = 'ai' | 'cli' | 'git' | 'manual';

export interface Context {
  id: string;
  projectId: string;
  type: ContextType;
  title: string;
  description: string;
  status: ContextStatus;
  tags: string[];
  author: string;
  source: ContextSource;
  confidence: number; // 0-100
  version: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface ContextCreate {
  projectId: string;
  type: ContextType;
  title: string;
  description: string;
  status?: ContextStatus;
  tags?: string[];
  author: string;
  source: ContextSource;
  confidence?: number;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface ContextUpdate {
  type?: ContextType;
  title?: string;
  description?: string;
  status?: ContextStatus;
  tags?: string[];
  confidence?: number;
  metadata?: Record<string, any>;
  expiresAt?: Date | null;
}

export interface ContextQuery {
  projectId?: string;
  type?: ContextType | ContextType[];
  status?: ContextStatus | ContextStatus[];
  tags?: string[];
  author?: string;
  source?: ContextSource;
  minConfidence?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'confidence';
  sortOrder?: 'asc' | 'desc';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
  projectIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  userId: string;
  projectId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface WebSocketMessage {
  type: 'context:update' | 'context:delete' | 'context:bulk-update' | 'ping' | 'pong';
  payload: any;
  timestamp: Date;
}

export interface ContextEvent {
  eventType: 'created' | 'updated' | 'deleted';
  context: Context;
  changes?: Partial<Context>;
  userId: string;
  timestamp: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: boolean;
    redis: boolean;
    websocket: boolean;
  };
  uptime: number;
  version: string;
}

export interface ContextStats {
  total: number;
  byType: Record<ContextType, number>;
  byStatus: Record<ContextStatus, number>;
  activeAuthors: number;
  recentUpdates: number;
}
