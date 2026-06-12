import type { Express } from 'express'
import {
  createCreateInvoiceController,
  createGetInvoiceController,
} from '../api/v1/controllers/invoice/invoice.controller'
import { createWebhookController } from '../api/v1/controllers/webhook/webhook.controller'
import { createInvoiceRoute } from '../api/v1/routes/invoice/invoice.route'
import { createWebhookRoute } from '../api/v1/routes/webhook/webhook.route'
import { createRateLimitMiddleware } from '../middleware/rate-limit/rate-limit.middleware'
import { createWebhookAuthMiddleware } from '../middleware/webhook-auth/webhook-auth.middleware'
import type { InvoiceService } from '../services/invoice/invoice.service'
import type { RateLimitService, TokenBucketPolicy } from '../services/rate-limit/rate-limit.service'
import type { ReplayProtectionService } from '../services/replay-protection/replay-protection.service'
import type { WebhookService } from '../services/webhook/webhook.service'

export interface RateLimitPolicies {
  createInvoicePerMerchant: TokenBucketPolicy
  createInvoicePerIp: TokenBucketPolicy
  getInvoicePerIp: TokenBucketPolicy
  webhookPerIp: TokenBucketPolicy
  webhookInvalidSignaturePerIp: TokenBucketPolicy
}

export interface RouteLoaderDeps {
  invoiceService: InvoiceService
  webhookService: WebhookService
  replayProtectionService: ReplayProtectionService
  webhookSecret: string
  rateLimitService: RateLimitService
  rateLimitPolicies: RateLimitPolicies
}

export const loadRoutes = (app: Express, deps: RouteLoaderDeps): void => {
  const createInvoiceController = createCreateInvoiceController(deps.invoiceService)
  const getInvoiceController = createGetInvoiceController(deps.invoiceService)

  const createInvoiceMerchantRateLimitMiddleware = createRateLimitMiddleware({
    rateLimitService: deps.rateLimitService,
    scope: 'invoice:create:merchant',
    policy: deps.rateLimitPolicies.createInvoicePerMerchant,
    resolveIdentifier: (req) => {
      const merchantId = (req.body as { merchantId?: unknown })?.merchantId
      return typeof merchantId === 'string' ? merchantId : getClientIp(req.ip)
    },
    exceededMessage: 'Invoice creation rate limit exceeded for merchant',
  })

  const createInvoiceIpRateLimitMiddleware = createRateLimitMiddleware({
    rateLimitService: deps.rateLimitService,
    scope: 'invoice:create:ip',
    policy: deps.rateLimitPolicies.createInvoicePerIp,
    resolveIdentifier: (req) => getClientIp(req.ip),
    exceededMessage: 'Invoice creation rate limit exceeded for IP',
  })

  const getInvoiceIpRateLimitMiddleware = createRateLimitMiddleware({
    rateLimitService: deps.rateLimitService,
    scope: 'invoice:get:ip',
    policy: deps.rateLimitPolicies.getInvoicePerIp,
    resolveIdentifier: (req) => getClientIp(req.ip),
    exceededMessage: 'Invoice read rate limit exceeded for IP',
  })

  const webhookRateLimitMiddleware = createRateLimitMiddleware({
    rateLimitService: deps.rateLimitService,
    scope: 'webhook:ip',
    policy: deps.rateLimitPolicies.webhookPerIp,
    resolveIdentifier: (req) => getClientIp(req.ip),
    exceededMessage: 'Webhook rate limit exceeded for IP',
  })

  const webhookAuthMiddleware = createWebhookAuthMiddleware({
    webhookSecret: deps.webhookSecret,
    replayProtectionService: deps.replayProtectionService,
    invalidSignatureRateLimit: {
      rateLimitService: deps.rateLimitService,
      policy: deps.rateLimitPolicies.webhookInvalidSignaturePerIp,
    },
  })

  const webhookController = createWebhookController(deps.webhookService)

  const invoiceRoute = createInvoiceRoute({
    createInvoiceController,
    getInvoiceController,
    createInvoiceMerchantRateLimitMiddleware,
    createInvoiceIpRateLimitMiddleware,
    getInvoiceIpRateLimitMiddleware,
  })

  const webhookRoute = createWebhookRoute({
    webhookAuthMiddleware,
    webhookController,
    webhookRateLimitMiddleware,
  })

  app.use(invoiceRoute)
  app.use(webhookRoute)
}

const getClientIp = (ip: string | undefined): string => {
  return ip ?? 'unknown'
}
