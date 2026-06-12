import { Router, type RequestHandler } from 'express'
import {
  createContractBodyValidator,
  createContractParamsValidator,
  createContractResponseValidator,
} from '../../../../core/http-contract'
import { createInvoiceContract } from '../../contracts/invoice/create-invoice.contract'
import { getInvoiceContract } from '../../contracts/invoice/get-invoice.contract'

export interface InvoiceRouteControllers {
  createInvoiceController: RequestHandler
  getInvoiceController: RequestHandler
  createInvoiceMerchantRateLimitMiddleware?: RequestHandler
  createInvoiceIpRateLimitMiddleware?: RequestHandler
  getInvoiceIpRateLimitMiddleware?: RequestHandler
}

export const createInvoiceRoute = ({
  createInvoiceController,
  getInvoiceController,
  createInvoiceMerchantRateLimitMiddleware = passThroughMiddleware,
  createInvoiceIpRateLimitMiddleware = passThroughMiddleware,
  getInvoiceIpRateLimitMiddleware = passThroughMiddleware,
}: InvoiceRouteControllers): Router => {
  const router = Router()

  router.post(
    '/invoice',
    createContractBodyValidator(createInvoiceContract),
    createInvoiceMerchantRateLimitMiddleware,
    createInvoiceIpRateLimitMiddleware,
    createContractResponseValidator(createInvoiceContract),
    createInvoiceController,
  )

  router.get(
    '/invoice/:id',
    createContractParamsValidator(getInvoiceContract),
    getInvoiceIpRateLimitMiddleware,
    createContractResponseValidator(getInvoiceContract),
    getInvoiceController,
  )

  return router
}

const passThroughMiddleware: RequestHandler = (_req, _res, next) => {
  return next()
}
