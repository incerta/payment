import { Router, type RequestHandler } from 'express'
import {
  createContractBodyValidator,
  createContractResponseValidator,
} from '../../../../core/http-contract'
import { processWebhookContract } from '../../contracts/webhook/process-webhook.contract'

export interface WebhookRouteDeps {
  webhookAuthMiddleware: RequestHandler
  webhookController: RequestHandler
  webhookRateLimitMiddleware?: RequestHandler
}

export const createWebhookRoute = ({
  webhookAuthMiddleware,
  webhookController,
  webhookRateLimitMiddleware = passThroughMiddleware,
}: WebhookRouteDeps): Router => {
  const router = Router()

  router.post(
    '/webhook',
    webhookRateLimitMiddleware,
    webhookAuthMiddleware,
    createContractBodyValidator(processWebhookContract),
    createContractResponseValidator(processWebhookContract),
    webhookController,
  )

  return router
}

const passThroughMiddleware: RequestHandler = (_req, _res, next) => {
  return next()
}
