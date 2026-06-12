import { Router, type RequestHandler } from 'express';
import {
  createContractBodyValidator,
  createContractResponseValidator,
} from '../../../../core/http-contract';
import { processWebhookContract } from '../../contracts/webhook/process-webhook.contract';

export interface WebhookRouteDeps {
  webhookAuthMiddleware: RequestHandler;
  webhookController: RequestHandler;
}

export const createWebhookRoute = ({
  webhookAuthMiddleware,
  webhookController,
}: WebhookRouteDeps): Router => {
  const router = Router();

  router.post(
    '/webhook',
    webhookAuthMiddleware,
    createContractBodyValidator(processWebhookContract),
    createContractResponseValidator(processWebhookContract),
    webhookController,
  );

  return router;
};
