import { z } from 'zod';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const invoiceIdSchema = z.string().trim().length(24).regex(OBJECT_ID_REGEX);
const webhookStatusSchema = z.enum(['paid', 'failed']);

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
