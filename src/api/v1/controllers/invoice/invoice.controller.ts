import type { ControllerType } from '../../../../core/controller.type';
import { BaseError, ControllerError } from '../../../../core/error';
import { InvoiceService } from '../../../../services/invoice/invoice.service';
import { parseCreateInvoiceRequest, parseInvoiceIdParam } from '../../routes/invoice/invoice.parsers';
import { mapInvoiceToCreateResponse } from './invoice.create.mappers';
import { mapInvoiceToGetResponse } from './invoice.get.mappers';

export const createCreateInvoiceController = (invoiceService: InvoiceService): ControllerType => {
  return async (req, res, next) => {
    try {
      const payload = parseCreateInvoiceRequest(req.body);
      const invoice = await invoiceService.createInvoice(payload);
      return res.status(201).json(mapInvoiceToCreateResponse(invoice));
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error);
      }

      return next(new ControllerError('Failed to create invoice'));
    }
  };
};

export const createGetInvoiceController = (invoiceService: InvoiceService): ControllerType => {
  return async (req, res, next) => {
    try {
      const id = parseInvoiceIdParam(req.params.id);
      const invoice = await invoiceService.getInvoiceById(id);
      return res.status(200).json(mapInvoiceToGetResponse(invoice));
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error);
      }

      return next(new ControllerError('Failed to fetch invoice'));
    }
  };
};
