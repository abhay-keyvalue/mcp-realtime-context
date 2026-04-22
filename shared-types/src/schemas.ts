import { z } from 'zod';

export const ContextTypeSchema = z.enum(['api', 'feature', 'decision', 'wip', 'bug']);

export const ContextStatusSchema = z.enum(['draft', 'in-progress', 'finalized', 'archived']);

export const ContextSourceSchema = z.enum(['ai', 'cli', 'git', 'manual']);

export const ContextCreateSchema = z.object({
  projectId: z.string().uuid(),
  type: ContextTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  status: ContextStatusSchema.optional().default('draft'),
  tags: z.array(z.string().max(50)).optional().default([]),
  author: z.string().min(1).max(100),
  source: ContextSourceSchema,
  confidence: z.number().min(0).max(100).optional().default(50),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.date().optional(),
});

export const ContextUpdateSchema = z.object({
  type: ContextTypeSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: ContextStatusSchema.optional(),
  tags: z.array(z.string().max(50)).optional(),
  confidence: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.date().optional().nullable(),
});

export const ContextQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  type: z.union([ContextTypeSchema, z.array(ContextTypeSchema)]).optional(),
  status: z.union([ContextStatusSchema, z.array(ContextStatusSchema)]).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  source: ContextSourceSchema.optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'confidence']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'developer', 'viewer']).optional().default('developer'),
  projectIds: z.array(z.string().uuid()).optional().default([]),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
