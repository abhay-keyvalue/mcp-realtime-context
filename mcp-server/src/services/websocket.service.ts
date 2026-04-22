import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { redisService } from './redis.service';
import { config } from '../config';

interface Client {
  ws: WebSocket;
  userId: string;
  projectIds: string[];
  isAlive: boolean;
}

export class WebSocketService {
  private clients: Map<string, Client> = new Map();
  private pingInterval?: NodeJS.Timeout;

  async initialize(fastify: FastifyInstance) {
    console.log('🔌 Initializing WebSocket service...');

    // Subscribe to Redis events
    await redisService.subscribe('context:events', (message) => {
      this.broadcastToClients(message);
    });

    // Setup ping/pong for keeping connections alive
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, config.websocket.pingInterval);

    console.log('✅ WebSocket service initialized');
  }

  registerClient(clientId: string, ws: WebSocket, userId: string, projectIds: string[]) {
    const client: Client = {
      ws,
      userId,
      projectIds,
      isAlive: true,
    };

    this.clients.set(clientId, client);

    ws.on('pong', () => {
      const c = this.clients.get(clientId);
      if (c) {
        c.isAlive = true;
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });

    console.log(`✅ Client ${clientId} connected (User: ${userId})`);
  }

  unregisterClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.ws.close();
      this.clients.delete(clientId);
      console.log(`❌ Client ${clientId} disconnected`);
    }
  }

  private broadcastToClients(message: string) {
    try {
      const event = JSON.parse(message);
      const projectId = event.context?.projectId;

      this.clients.forEach((client) => {
        // Only send to clients with access to this project
        if (!projectId || client.projectIds.includes(projectId)) {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
          }
        }
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcastToProject(projectId: string, message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.projectIds.includes(projectId) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.clients.clear();
    console.log('🔌 WebSocket service shut down');
  }
}

export const websocketService = new WebSocketService();
