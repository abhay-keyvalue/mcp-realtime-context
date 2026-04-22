import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { contextService } from '../services/context.service';
import { contextEngineService } from '../services/context-engine.service';
import { authService } from '../services/auth.service';
import { validateContextCreate, validateContextUpdate, validateContextQuery } from '@mcp/shared-types';

export async function contextRoutes(fastify: FastifyInstance) {
  // Create or update context
  fastify.post('/update', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const data = validateContextCreate(request.body);

      // Verify project access
      const hasAccess = await authService.hasProjectAccess(decoded.userId, data.projectId);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied to this project' });
      }

      const context = await contextService.create(data);

      return reply.code(201).send(context);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to create context',
      });
    }
  });

  // Get contexts with filters
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const filters = validateContextQuery(request.query);

      // If projectId specified, verify access
      if (filters.projectId) {
        const hasAccess = await authService.hasProjectAccess(decoded.userId, filters.projectId);
        if (!hasAccess) {
          return reply.code(403).send({ error: 'Access denied to this project' });
        }
      } else {
        // If no project specified, get user's projects
        const projectIds = await authService.getUserProjects(decoded.userId);
        if (projectIds.length === 0) {
          return reply.send([]);
        }
        // Filter by user's projects (would need to modify query method)
      }

      const contexts = await contextService.query(filters);

      return reply.send(contexts);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to fetch contexts',
      });
    }
  });

  // Get single context by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decoded = request.user as any;

      const context = await contextService.findById(id);

      if (!context) {
        return reply.code(404).send({ error: 'Context not found' });
      }

      // Verify project access
      const hasAccess = await authService.hasProjectAccess(decoded.userId, context.projectId);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      return reply.send(context);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch context',
      });
    }
  });

  // Update context
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decoded = request.user as any;
      const data = validateContextUpdate(request.body);

      // First get the context to check access
      const existing = await contextService.findById(id);
      if (!existing) {
        return reply.code(404).send({ error: 'Context not found' });
      }

      const hasAccess = await authService.hasProjectAccess(decoded.userId, existing.projectId);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const context = await contextService.update(id, data);

      return reply.send(context);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to update context',
      });
    }
  });

  // Delete context
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decoded = request.user as any;

      const existing = await contextService.findById(id);
      if (!existing) {
        return reply.code(404).send({ error: 'Context not found' });
      }

      const hasAccess = await authService.hasProjectAccess(decoded.userId, existing.projectId);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const deleted = await contextService.delete(id);

      if (deleted) {
        return reply.code(204).send();
      } else {
        return reply.code(404).send({ error: 'Context not found' });
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to delete context',
      });
    }
  });

  // Get stats
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: { projectId?: string } }>, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const { projectId } = request.query;

      if (projectId) {
        const hasAccess = await authService.hasProjectAccess(decoded.userId, projectId);
        if (!hasAccess) {
          return reply.code(403).send({ error: 'Access denied' });
        }
      }

      const stats = await contextService.getStats(projectId);

      return reply.send(stats);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch stats',
      });
    }
  });

  // AI-powered context creation with normalization
  fastify.post('/smart-create', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Body: { projectId: string; input: string; author: string } }>, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const { projectId, input, author } = request.body;

      if (!projectId || !input || !author) {
        return reply.code(400).send({ error: 'projectId, input, and author are required' });
      }

      const hasAccess = await authService.hasProjectAccess(decoded.userId, projectId);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      // Normalize the input
      const normalized = contextEngineService.normalizeInput(input, 'ai');

      // Create context
      const context = await contextService.create({
        projectId,
        type: normalized.type,
        title: normalized.title,
        description: normalized.description,
        tags: normalized.tags,
        author,
        source: 'ai',
        confidence: normalized.confidence,
        status: 'draft',
      });

      return reply.code(201).send({
        context,
        normalized: {
          detectedType: normalized.type,
          extractedTags: normalized.tags,
          confidence: normalized.confidence,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to create context',
      });
    }
  });
}
