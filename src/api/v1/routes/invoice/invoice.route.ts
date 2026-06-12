import { Router, type RequestHandler } from 'express';

export interface InvoiceRouteControllers {
  createInvoiceController: RequestHandler;
  getInvoiceController: RequestHandler;
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
