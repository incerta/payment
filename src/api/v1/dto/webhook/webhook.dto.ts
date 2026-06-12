import { RouteError } from '../../../../core/error';
import { z, type ZodError } from 'zod';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const invoiceIdSchema = z.string().trim().length(24).regex(OBJECT_ID_REGEX);
const webhookStatusSchema = z.enum(['paid', 'failed']);

const mapZodToRouteError = (error: ZodError, message: string): RouteError => {
  return new RouteError(message, {
    statusCode: 400,
    details: {
      issues: error.issues,
    },
  });
};

export const webhookRequestSchema = z.object({
  invoiceId: invoiceIdSchema,
  status: webhookStatusSchema,
});

export const webhookResponseSchema = z.object({
  invoiceId: invoiceIdSchema,
  status: z.enum(['pending', 'paid', 'failed']),
  creditedNow: z.boolean(),
});

export type WebhookRequestDto = z.infer<typeof webhookRequestSchema>;
export type WebhookResponseDto = z.infer<typeof webhookResponseSchema>;
export type WebhookStatus = z.infer<typeof webhookStatusSchema>;

export const parseWebhookRequest = (body: unknown): WebhookRequestDto => {
  const validationResult = webhookRequestSchema.safeParse(body);
  if (validationResult.success) {
    return validationResult.data;
  }

  throw mapZodToRouteError(validationResult.error, 'Invalid webhook payload');
};
