import type { Express } from 'express'
import {
  createCreateInvoiceController,
  createGetInvoiceController,
} from '../api/v1/controllers/invoice/invoice.controller'
import { createWebhookController } from '../api/v1/controllers/webhook/webhook.controller'
import { createWebhookAuthMiddleware } from '../middleware/webhook-auth/webhook-auth.middleware'
import { createInvoiceRoute } from '../api/v1/routes/invoice/invoice.route'
import { createWebhookRoute } from '../api/v1/routes/webhook/webhook.route'
import type { InvoiceService } from '../services/invoice/invoice.service'
import type { ReplayProtectionService } from '../services/replay-protection/replay-protection.service'
import type { WebhookService } from '../services/webhook/webhook.service'

export interface RouteLoaderDeps {
  invoiceService: InvoiceService
  webhookService: WebhookService
  replayProtectionService: ReplayProtectionService
  webhookSecret: string
}

export const loadRoutes = (app: Express, deps: RouteLoaderDeps): void => {
  const createInvoiceController = createCreateInvoiceController(deps.invoiceService)
  const getInvoiceController = createGetInvoiceController(deps.invoiceService)

  const webhookAuthMiddleware = createWebhookAuthMiddleware({
    webhookSecret: deps.webhookSecret,
    replayProtectionService: deps.replayProtectionService,
  })

  const webhookController = createWebhookController(deps.webhookService)

  const invoiceRoute = createInvoiceRoute({
    createInvoiceController,
    getInvoiceController,
  })

  const webhookRoute = createWebhookRoute({
    webhookAuthMiddleware,
    webhookController,
  })

  app.use(invoiceRoute)
  app.use(webhookRoute)
}
