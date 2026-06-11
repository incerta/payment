import type { ProcessWebhookResult } from '../../../../services/webhook/webhook.service';
import type { WebhookResponseDto } from '../../routes/webhook/webhook.types';

export const mapWebhookResultToResponse = (result: ProcessWebhookResult): WebhookResponseDto => {
  return {
    invoiceId: result.invoice._id.toString(),
    status: result.invoice.status,
    creditedNow: result.creditedNow,
  };
};
