import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { validateUserCreate, validateLogin } from '@mcp/shared-types';

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = validateUserCreate(request.body);
      
      const user = await authService.createUser(
        data.email,
        data.password,
        data.name,
        data.role
      );

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.code(201).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        return reply.code(409).send({
          error: 'User already exists',
        });
      }
      
      return reply.code(400).send({
        error: error.message || 'Registration failed',
      });
    }
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = validateLogin(request.body);

      const user = await authService.validateCredentials(data.email, data.password);

      if (!user) {
        return reply.code(401).send({
          error: 'Invalid credentials',
        });
      }

      const projectIds = await authService.getUserProjects(user.id);

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        projectIds,
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          projectIds,
        },
        token,
      });
    } catch (error: any) {
      return reply.code(400).send({
        error: error.message || 'Login failed',
      });
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = request.user as any;
      const user = await authService.findUserById(decoded.userId);

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const projectIds = await authService.getUserProjects(user.id);

      return reply.send({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        projectIds,
      });
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message || 'Failed to fetch user',
      });
    }
  });
}
