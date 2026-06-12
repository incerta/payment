import type { RequestHandler } from 'express'
import { BaseError, ControllerError } from '../../../../core/error'
import { InvoiceService } from '../../../../services/invoice/invoice.service'
import {
  type CreateInvoiceRequestDto,
  type GetInvoiceParamsDto,
} from '../../dto/invoice/invoice.dto'
import { mapInvoiceToCreateResponse } from './invoice.create.mappers'
import { mapInvoiceToGetResponse } from './invoice.get.mappers'

export const createCreateInvoiceController = (invoiceService: InvoiceService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const payload = req.body as CreateInvoiceRequestDto
      const invoice = await invoiceService.createInvoice(payload)
      const response = mapInvoiceToCreateResponse(invoice)
      return res.status(201).json(response)
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error)
      }

      return next(new ControllerError('Failed to create invoice'))
    }
  }
}

export const createGetInvoiceController = (invoiceService: InvoiceService): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { id } = req.params as GetInvoiceParamsDto
      const invoice = await invoiceService.getInvoiceById(id)
      const response = mapInvoiceToGetResponse(invoice)
      return res.status(200).json(response)
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error)
      }

      return next(new ControllerError('Failed to fetch invoice'))
    }
  }
}
