import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { getInvoiceParamsSchema, getInvoiceResponseSchema } from '../../dto/invoice/invoice.dto'
import {
  internalServerErrorResponseSchema,
  notFoundErrorResponseSchema,
  routeValidationErrorResponseSchema,
} from '../errors.contract'

export const getInvoiceContract = {
  method: 'get',
  path: '/invoice/:id',
  operationId: 'getInvoice',
  summary: 'Get invoice by id',
  request: {
    params: getInvoiceParamsSchema,
    paramsErrorMessage: 'Invalid invoice id route param',
  },
  responses: {
    200: getInvoiceResponseSchema,
    400: routeValidationErrorResponseSchema,
    404: notFoundErrorResponseSchema,
    500: internalServerErrorResponseSchema,
  },
} as const

export const registerGetInvoiceContract = (registry: OpenAPIRegistry): void => {
  const getInvoiceParams = registry.register('GetInvoiceParams', getInvoiceParamsSchema)
  const getInvoiceResponse = registry.register('GetInvoiceResponse', getInvoiceResponseSchema)

  registry.registerPath({
    method: getInvoiceContract.method,
    path: '/invoice/{id}',
    operationId: getInvoiceContract.operationId,
    summary: getInvoiceContract.summary,
    tags: ['Invoice'],
    request: {
      params: getInvoiceParams,
    },
    responses: {
      200: {
        description: 'Invoice data',
        content: {
          'application/json': {
            schema: getInvoiceResponse,
          },
        },
      },
      400: {
        description: 'Invalid invoice id format',
        content: {
          'application/json': {
            schema: routeValidationErrorResponseSchema,
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
