import { type ZodType } from 'zod';
import { ControllerError } from './error';

const isOutputValidationEnabled = process.env.NODE_ENV !== 'production';

export const validateRouteOutput = <T>(schema: ZodType<T>, payload: unknown, route: string): T => {
  if (!isOutputValidationEnabled) {
    return payload as T;
  }

  const validationResult = schema.safeParse(payload);
  if (validationResult.success) {
    return validationResult.data;
  }

  throw new ControllerError(`Invalid response payload for ${route}`, {
    statusCode: 500,
    details: {
      issues: validationResult.error.issues,
    },
  });
};
