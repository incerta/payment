import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

const errorDetailsSchema = z.record(z.unknown()).optional();

const createClassErrorSchema = <TCode extends string>(code: TCode) => {
  return z.object({
    error: z.object({
      code: z.literal(code),
      message: z.string(),
      details: errorDetailsSchema,
    }),
  });
};

export const zodIssueSchema = z
  .object({
    code: z.string(),
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
  })
  .passthrough();

export const routeValidationErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal('ROUTE_ERROR'),
    message: z.string(),
    details: z.object({
      issues: z.array(zodIssueSchema),
    }),
  }),
});

export const middlewareErrorResponseSchema = createClassErrorSchema('MIDDLEWARE_ERROR');
export const controllerErrorResponseSchema = createClassErrorSchema('CONTROLLER_ERROR');
export const serviceErrorResponseSchema = createClassErrorSchema('SERVICE_ERROR');
export const repositoryErrorResponseSchema = createClassErrorSchema('REPOSITORY_ERROR');

export const internalErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal('INTERNAL_ERROR'),
    message: z.string(),
  }),
});

export const unauthorizedErrorResponseSchema = z.union([
  middlewareErrorResponseSchema,
  serviceErrorResponseSchema,
]);

export const conflictErrorResponseSchema = serviceErrorResponseSchema;
export const notFoundErrorResponseSchema = serviceErrorResponseSchema;

export const internalServerErrorResponseSchema = z.union([
  internalErrorResponseSchema,
  controllerErrorResponseSchema,
  serviceErrorResponseSchema,
  repositoryErrorResponseSchema,
]);

export const registerErrorSchemas = (registry: OpenAPIRegistry): void => {
  registry.register('ZodIssue', zodIssueSchema);
  registry.register('RouteValidationErrorResponse', routeValidationErrorResponseSchema);
  registry.register('MiddlewareErrorResponse', middlewareErrorResponseSchema);
  registry.register('ControllerErrorResponse', controllerErrorResponseSchema);
  registry.register('ServiceErrorResponse', serviceErrorResponseSchema);
  registry.register('RepositoryErrorResponse', repositoryErrorResponseSchema);
  registry.register('InternalErrorResponse', internalErrorResponseSchema);
  registry.register('UnauthorizedErrorResponse', unauthorizedErrorResponseSchema);
  registry.register('ConflictErrorResponse', conflictErrorResponseSchema);
  registry.register('NotFoundErrorResponse', notFoundErrorResponseSchema);
  registry.register('InternalServerErrorResponse', internalServerErrorResponseSchema);
};
