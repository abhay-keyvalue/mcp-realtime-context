import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config';

async function authPluginImplementation(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export const authPlugin = fastifyPlugin(authPluginImplementation);
