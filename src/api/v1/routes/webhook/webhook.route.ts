import { Router, type RequestHandler } from 'express';

export interface WebhookRouteDeps {
  webhookAuthMiddleware: RequestHandler;
  webhookController: RequestHandler;
}

export const createWebhookRoute = ({
  webhookAuthMiddleware,
  webhookController,
}: WebhookRouteDeps): Router => {
  const router = Router();

  router.post('/webhook', webhookAuthMiddleware, webhookController);

  return router;
};
