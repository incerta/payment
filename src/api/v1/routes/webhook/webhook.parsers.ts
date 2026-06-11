import { RouteError } from '../../../../core/error';
import type { WebhookRequestDto } from './webhook.types';

export const parseWebhookRequest = (body: unknown): WebhookRequestDto => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new RouteError('Webhook body must be an object', { statusCode: 400 });
  }

  const payload = body as Record<string, unknown>;

  const invoiceId = payload.invoiceId;
  if (typeof invoiceId !== 'string' || invoiceId.trim().length === 0) {
    throw new RouteError('invoiceId is required', { statusCode: 400 });
  }

  const status = payload.status;
  if (!(status === 'paid' || status === 'failed')) {
    throw new RouteError('status must be paid or failed', { statusCode: 400 });
  }

  return {
    invoiceId: invoiceId.trim(),
    status,
  };
};
