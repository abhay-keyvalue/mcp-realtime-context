import { FastifyInstance, FastifyRequest } from 'fastify';
import { websocketService } from '../services/websocket.service';
import { authService } from '../services/auth.service';
import { nanoid } from 'nanoid';

export async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get('/stream', { websocket: true }, async (connection, request: FastifyRequest) => {
    const { socket } = connection;

    try {
      // Extract token from query string
      const token = (request.query as any).token;

      if (!token) {
        socket.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT
      const decoded = await fastify.jwt.verify(token) as any;
      const userId = decoded.userId;

      // Get user's project IDs
      const projectIds = await authService.getUserProjects(userId);

      if (projectIds.length === 0) {
        socket.close(1008, 'No projects available');
        return;
      }

      const clientId = nanoid();

      // Register WebSocket client
      websocketService.registerClient(clientId, socket, userId, projectIds);

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connected',
        payload: {
          clientId,
          message: 'Connected to MCP Context Stream',
          projectIds,
        },
        timestamp: new Date(),
      }));

      // Handle incoming messages
      socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'ping') {
            socket.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date(),
            }));
          }
        } catch (error) {
          fastify.log.error('WebSocket message error:', error);
        }
      });

      socket.on('close', () => {
        websocketService.unregisterClient(clientId);
      });

      socket.on('error', (error) => {
        fastify.log.error(`WebSocket error for client ${clientId}:`, error);
        websocketService.unregisterClient(clientId);
      });

    } catch (error) {
      fastify.log.error('WebSocket connection error:', error);
      socket.close(1008, 'Authentication failed');
    }
  });
}
