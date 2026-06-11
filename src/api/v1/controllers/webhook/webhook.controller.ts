import type { ControllerType } from '../../../../core/controller.type';
import { BaseError, ControllerError } from '../../../../core/error';
import { WebhookService } from '../../../../services/webhook/webhook.service';
import { parseWebhookRequest } from '../../routes/webhook/webhook.parsers';
import { mapWebhookResultToResponse } from './webhook.process.mappers';

export const createWebhookController = (webhookService: WebhookService): ControllerType => {
  return async (req, res, next) => {
    try {
      const payload = parseWebhookRequest(req.body);
      const result = await webhookService.processWebhook(payload);

      return res.status(200).json(mapWebhookResultToResponse(result));
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error);
      }

      return next(new ControllerError('Failed to process webhook'));
    }
  };
};
