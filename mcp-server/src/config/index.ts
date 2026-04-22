import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/mcp_context',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
  },
};

export function validateConfig() {
  if (!config.jwt.secret || config.jwt.secret === 'change-this-secret') {
    console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!');
  }
  
  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }
  
  if (!config.redis.url) {
    throw new Error('REDIS_URL is required');
  }
}
