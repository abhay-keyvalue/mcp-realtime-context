import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { testConnection } from '../db/pool';
import { redisService } from '../services/redis.service';
import { websocketService } from '../services/websocket.service';

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const dbHealthy = await testConnection();
    const redisHealthy = await redisService.ping();
    const wsConnections = websocketService.getConnectedClients();

    const allHealthy = dbHealthy && redisHealthy;

    const status = allHealthy ? 'healthy' : 'degraded';
    const statusCode = allHealthy ? 200 : 503;

    return reply.code(statusCode).send({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy,
        redis: redisHealthy,
        websocket: true,
      },
      uptime: Date.now() - startTime,
      version: '1.0.0',
      websocketConnections: wsConnections,
    });
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const dbHealthy = await testConnection();
    const redisHealthy = await redisService.ping();

    if (dbHealthy && redisHealthy) {
      return reply.send({ ready: true });
    } else {
      return reply.code(503).send({ ready: false });
    }
  });

  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ alive: true });
  });
}
