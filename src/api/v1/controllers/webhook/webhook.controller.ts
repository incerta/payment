import type { RequestHandler } from 'express';
import { BaseError, ControllerError } from '../../../../core/error';
import { validateRouteOutput } from '../../../../core/route-deprecate-middleware';
import { WebhookService } from '../../../../services/webhook/webhook.service';
import { parseWebhookRequest, webhookResponseSchema } from '../../dto/webhook/webhook.dto';
import { mapWebhookResultToResponse } from './webhook.process.mappers';

export const createWebhookController = (webhookService: WebhookService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const payload = parseWebhookRequest(req.body);
      const result = await webhookService.processWebhook(payload);
      const response = mapWebhookResultToResponse(result);

      return res
        .status(200)
        .json(validateRouteOutput(webhookResponseSchema, response, 'POST /webhook'));
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error);
      }

      return next(new ControllerError('Failed to process webhook'));
    }
  };
};
