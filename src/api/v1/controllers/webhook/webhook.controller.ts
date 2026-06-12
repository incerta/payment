import type { RequestHandler } from 'express';
import { BaseError, ControllerError } from '../../../../core/error';
import { WebhookService } from '../../../../services/webhook/webhook.service';
import { type WebhookRequestDto } from '../../dto/webhook/webhook.dto';
import { mapWebhookResultToResponse } from './webhook.process.mappers';

export const createWebhookController = (webhookService: WebhookService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const payload = req.body as WebhookRequestDto;
      const result = await webhookService.processWebhook(payload);
      const response = mapWebhookResultToResponse(result);

      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error);
      }

      return next(new ControllerError('Failed to process webhook'));
    }
  };
};
