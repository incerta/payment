import { Router, type RequestHandler } from 'express';
import {
  createContractBodyValidator,
  createContractParamsValidator,
  createContractResponseValidator,
} from '../../../../core/http-contract';
import { createInvoiceContract } from '../../contracts/invoice/create-invoice.contract';
import { getInvoiceContract } from '../../contracts/invoice/get-invoice.contract';

export interface InvoiceRouteControllers {
  createInvoiceController: RequestHandler;
  getInvoiceController: RequestHandler;
}

export const createInvoiceRoute = ({
  createInvoiceController,
  getInvoiceController,
}: InvoiceRouteControllers): Router => {
  const router = Router();

  router.post(
    '/invoice',
    createContractBodyValidator(createInvoiceContract),
    createContractResponseValidator(createInvoiceContract),
    createInvoiceController,
  );

  router.get(
    '/invoice/:id',
    createContractParamsValidator(getInvoiceContract),
    createContractResponseValidator(getInvoiceContract),
    getInvoiceController,
  );

  return router;
};
