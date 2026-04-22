import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { projectService } from '../services/project.service';
import { authService } from '../services/auth.service';
import { validateProjectCreate } from '@mcp/shared-types';

export async function projectRoutes(fastify: FastifyInstance) {
  // Create project
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const data = validateProjectCreate(request.body);

      const project = await projectService.create(
        data.name,
        data.description,
        decoded.userId
      );

      // Automatically add creator to project
      await authService.addUserToProject(decoded.userId, project.id);

      return reply.code(201).send(project);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to create project',
      });
    }
  });

  // Get user's projects
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const projects = await projectService.findByUserId(decoded.userId);

      return reply.send(projects);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch projects',
      });
    }
  });

  // Get project by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decoded = request.user as any;

      const hasAccess = await authService.hasProjectAccess(decoded.userId, id);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const project = await projectService.findById(id);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return reply.send(project);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch project',
      });
    }
  });

  // Update project
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; description?: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decoded = request.user as any;
      const { name, description } = request.body;

      const hasAccess = await authService.hasProjectAccess(decoded.userId, id);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const project = await projectService.update(id, name, description);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return reply.send(project);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to update project',
      });
    }
  });

  // Delete project
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const decoded = request.user as any;

      // Only owner can delete
      const project = await projectService.findById(id);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (project.ownerId !== decoded.userId) {
        return reply.code(403).send({ error: 'Only project owner can delete' });
      }

      const deleted = await projectService.delete(id);

      if (deleted) {
        return reply.code(204).send();
      } else {
        return reply.code(404).send({ error: 'Project not found' });
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to delete project',
      });
    }
  });

  // Add user to project
  fastify.post('/:id/users', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { userId } = request.body;
      const decoded = request.user as any;

      const project = await projectService.findById(id);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (project.ownerId !== decoded.userId) {
        return reply.code(403).send({ error: 'Only project owner can add users' });
      }

      await authService.addUserToProject(userId, id);

      return reply.code(201).send({ message: 'User added to project' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({
        error: error.message || 'Failed to add user to project',
      });
    }
  });

  // Remove user from project
  fastify.delete('/:id/users/:userId', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string; userId: string } }>, reply: FastifyReply) => {
    try {
      const { id, userId } = request.params;
      const decoded = request.user as any;

      const project = await projectService.findById(id);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (project.ownerId !== decoded.userId) {
        return reply.code(403).send({ error: 'Only project owner can remove users' });
      }

      await authService.removeUserFromProject(userId, id);

      return reply.code(204).send();
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Failed to remove user from project',
      });
    }
  });
}
