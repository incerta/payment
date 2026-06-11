import { Router } from 'express';
import type { ControllerType } from '../../../../core/controller.type';

export interface InvoiceRouteControllers {
  createInvoiceController: ControllerType;
  getInvoiceController: ControllerType;
}

export const createInvoiceRoute = ({
  createInvoiceController,
  getInvoiceController,
}: InvoiceRouteControllers): Router => {
  const router = Router();

  router.post('/invoice', createInvoiceController);
  router.get('/invoice/:id', getInvoiceController);

  return router;
};
