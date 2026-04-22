import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import { config, validateConfig } from './config';
import { testConnection, closePool } from './db/pool';
import { redisService } from './services/redis.service';
import { websocketService } from './services/websocket.service';
import { authPlugin } from './plugins/auth.plugin';
import { authRoutes } from './routes/auth.routes';
import { projectRoutes } from './routes/project.routes';
import { contextRoutes } from './routes/context.routes';
import { websocketRoutes } from './routes/websocket.routes';
import { healthRoutes } from './routes/health.routes';

async function start() {
  validateConfig();

  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.env === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const dbHealthy = await testConnection();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected');

    // Test Redis connection
    console.log('🔄 Testing Redis connection...');
    const redisHealthy = await redisService.ping();
    if (!redisHealthy) {
      throw new Error('Redis connection failed');
    }
    console.log('✅ Redis connected');

    // Register plugins
    await fastify.register(fastifyCors, {
      origin: config.cors.origin,
      credentials: true,
    });

    await fastify.register(fastifyRateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
    });

    await fastify.register(fastifyWebsocket);

    await fastify.register(authPlugin);

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(projectRoutes, { prefix: '/projects' });
    await fastify.register(contextRoutes, { prefix: '/context' });
    await fastify.register(websocketRoutes, { prefix: '/ws' });

    // Initialize WebSocket service
    await websocketService.initialize(fastify);

    // Root endpoint
    fastify.get('/', async () => {
      return {
        name: 'MCP Real-Time Context Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          auth: '/auth',
          projects: '/projects',
          context: '/context',
          websocket: '/ws/stream',
        },
      };
    });

    // Start server
    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`
╔═══════════════════════════════════════════════════╗
║  🚀 MCP Real-Time Context Server                 ║
║                                                   ║
║  Server running at: http://${config.host}:${config.port}      ║
║  Environment: ${config.env.padEnd(23)} ║
║  WebSocket: ws://${config.host}:${config.port}/ws/stream    ║
╚═══════════════════════════════════════════════════╝
    `);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
        
        websocketService.shutdown();
        await redisService.close();
        await closePool();
        await fastify.close();
        
        console.log('✅ Server shut down successfully');
        process.exit(0);
      });
    }

  } catch (error) {
    fastify.log.error(error);
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
