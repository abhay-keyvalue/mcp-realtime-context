import { z } from 'zod';
import {
  ContextCreateSchema,
  ContextUpdateSchema,
  ContextQuerySchema,
  UserCreateSchema,
  LoginSchema,
  ProjectCreateSchema,
} from './schemas';

export function validateContextCreate(data: unknown) {
  return ContextCreateSchema.parse(data);
}

export function validateContextUpdate(data: unknown) {
  return ContextUpdateSchema.parse(data);
}

export function validateContextQuery(data: unknown) {
  return ContextQuerySchema.parse(data);
}

export function validateUserCreate(data: unknown) {
  return UserCreateSchema.parse(data);
}

export function validateLogin(data: unknown) {
  return LoginSchema.parse(data);
}

export function validateProjectCreate(data: unknown) {
  return ProjectCreateSchema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
