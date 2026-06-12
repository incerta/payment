import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import {
  createInvoiceRequestSchema,
  createInvoiceResponseSchema,
} from '../../dto/invoice/invoice.dto'
import {
  internalServerErrorResponseSchema,
  notFoundErrorResponseSchema,
  routeValidationErrorResponseSchema,
  serviceErrorResponseSchema,
  tooManyRequestsErrorResponseSchema,
} from '../errors.contract'

const createInvoiceBadRequestErrorResponseSchema = z.union([
  routeValidationErrorResponseSchema,
  serviceErrorResponseSchema,
])

export const createInvoiceContract = {
  method: 'post',
  path: '/invoice',
  operationId: 'createInvoice',
  summary: 'Create invoice',
  request: {
    body: createInvoiceRequestSchema,
    bodyErrorMessage: 'Invalid create invoice request payload',
  },
  responses: {
    201: createInvoiceResponseSchema,
    400: createInvoiceBadRequestErrorResponseSchema,
    404: notFoundErrorResponseSchema,
    429: tooManyRequestsErrorResponseSchema,
    500: internalServerErrorResponseSchema,
  },
} as const

export type CreateInvoiceRequestContractBody = z.infer<typeof createInvoiceRequestSchema>

export const registerCreateInvoiceContract = (registry: OpenAPIRegistry): void => {
  const createInvoiceRequest = registry.register('CreateInvoiceRequest', createInvoiceRequestSchema)
  const createInvoiceResponse = registry.register(
    'CreateInvoiceResponse',
    createInvoiceResponseSchema,
  )
  const createInvoiceBadRequest = registry.register(
    'CreateInvoiceBadRequestErrorResponse',
    createInvoiceBadRequestErrorResponseSchema,
  )

  registry.registerPath({
    method: createInvoiceContract.method,
    path: '/invoice',
    operationId: createInvoiceContract.operationId,
    summary: createInvoiceContract.summary,
    tags: ['Invoice'],
    request: {
      body: {
        description: 'Invoice creation payload',
        required: true,
        content: {
          'application/json': {
            schema: createInvoiceRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Invoice has been created',
        content: {
          'application/json': {
            schema: createInvoiceResponse,
          },
        },
      },
      400: {
        description: 'Invalid request payload',
        content: {
          'application/json': {
            schema: createInvoiceBadRequest,
          },
        },
      },
      404: {
        description: 'Merchant was not found',
        content: {
          'application/json': {
            schema: notFoundErrorResponseSchema,
          },
        },
      },
      429: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: tooManyRequestsErrorResponseSchema,
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
