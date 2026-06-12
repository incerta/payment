import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { webhookRequestSchema, webhookResponseSchema } from '../../dto/webhook/webhook.dto'
import {
  conflictErrorResponseSchema,
  internalServerErrorResponseSchema,
  middlewareErrorResponseSchema,
  notFoundErrorResponseSchema,
  routeValidationErrorResponseSchema,
  unauthorizedErrorResponseSchema,
} from '../errors.contract'

const webhookHeadersSchema = z.object({
  'X-Signature': z
    .string()
    .trim()
    .regex(/^(sha256=)?[A-Fa-f\d]{64}$/),
  'X-Timestamp': z.string().trim().regex(/^\d+$/),
  'X-Nonce': z.string().trim().min(1).max(128),
})

const processWebhookBadRequestErrorResponseSchema = z.union([
  routeValidationErrorResponseSchema,
  middlewareErrorResponseSchema,
])

export const processWebhookContract = {
  method: 'post',
  path: '/webhook',
  operationId: 'processWebhook',
  summary: 'Process merchant webhook event',
  request: {
    body: webhookRequestSchema,
    bodyErrorMessage: 'Invalid webhook payload',
    headers: webhookHeadersSchema,
  },
  responses: {
    200: webhookResponseSchema,
    400: processWebhookBadRequestErrorResponseSchema,
    401: unauthorizedErrorResponseSchema,
    404: notFoundErrorResponseSchema,
    409: conflictErrorResponseSchema,
    500: internalServerErrorResponseSchema,
  },
} as const

export const registerProcessWebhookContract = (registry: OpenAPIRegistry): void => {
  const processWebhookRequest = registry.register('ProcessWebhookRequest', webhookRequestSchema)
  const processWebhookResponse = registry.register('ProcessWebhookResponse', webhookResponseSchema)
  const webhookHeaders = registry.register('WebhookHeaders', webhookHeadersSchema)
  const processWebhookBadRequest = registry.register(
    'ProcessWebhookBadRequestErrorResponse',
    processWebhookBadRequestErrorResponseSchema,
  )

  registry.registerPath({
    method: processWebhookContract.method,
    path: '/webhook',
    operationId: processWebhookContract.operationId,
    summary: processWebhookContract.summary,
    tags: ['Webhook'],
    request: {
      headers: webhookHeaders,
      body: {
        description: 'Webhook payload signed with HMAC-SHA256(raw request body)',
        required: true,
        content: {
          'application/json': {
            schema: processWebhookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Webhook has been processed',
        content: {
          'application/json': {
            schema: processWebhookResponse,
          },
        },
      },
      400: {
        description: 'Invalid request payload',
        content: {
          'application/json': {
            schema: processWebhookBadRequest,
          },
        },
      },
      401: {
        description: 'Authentication failed',
        content: {
          'application/json': {
            schema: unauthorizedErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Invoice not found',
        content: {
          'application/json': {
            schema: notFoundErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'Replay protection conflict',
        content: {
          'application/json': {
            schema: conflictErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal application error',
        content: {
          'application/json': {
            schema: internalServerErrorResponseSchema,
          },
        },
      },
    },
  })
}
