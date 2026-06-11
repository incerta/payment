import { Router } from 'express';
import type { ControllerType } from '../../../../core/controller.type';
import type { MiddlewareType } from '../../../../core/middleware.type';

export interface WebhookRouteDeps {
  webhookAuthMiddleware: MiddlewareType;
  webhookController: ControllerType;
}

export const createWebhookRoute = ({ webhookAuthMiddleware, webhookController }: WebhookRouteDeps): Router => {
  const router = Router();

  router.post('/webhook', webhookAuthMiddleware, webhookController);

  return router;
};
