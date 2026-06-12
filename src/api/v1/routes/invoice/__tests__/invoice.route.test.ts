import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { BaseError } from '../../../../../core/error';
import { createInvoiceRoute } from '../invoice.route';

describe('invoice route', () => {
  const createErrorHandlerApp = (router: express.Router) => {
    const app = express();
    app.use(express.json());
    app.use(router);

    app.use(
      (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        if (error instanceof BaseError) {
          return res.status(error.statusCode).json({
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          });
        }

        return res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      },
    );

    return app;
  };

  test('returns 400 route error when POST /invoice payload is invalid', async () => {
    const createInvoiceControllerMock = jest.fn((_req: express.Request, res: express.Response) => {
      return res.status(201).json({ ok: true });
    });

    const app = createErrorHandlerApp(
      createInvoiceRoute({
        createInvoiceController: createInvoiceControllerMock as RequestHandler,
        getInvoiceController: (_req, res) => res.status(200).json({ ok: true }),
      }),
    );

    const response = await request(app).post('/invoice').send({
      amount: '10.00',
      currency: 'usd',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_ERROR');
    expect(Array.isArray(response.body.error.details?.issues)).toBe(true);
    expect(createInvoiceControllerMock).not.toHaveBeenCalled();
  });

  test('passes validated payload through req.body for POST /invoice', async () => {
    let capturedPayload: unknown;

    const createInvoiceController: RequestHandler = (req, res) => {
      capturedPayload = req.body;
      return res.status(201).json({
        invoiceId: '507f1f77bcf86cd799439011',
        status: 'pending',
        currency: 'USD',
        amount: '10.50',
        fee: '0.30',
        amountToReceive: '10.20',
      });
    };

    const app = createErrorHandlerApp(
      createInvoiceRoute({
        createInvoiceController,
        getInvoiceController: (_req, res) => res.status(200).json({ ok: true }),
      }),
    );

    const response = await request(app).post('/invoice').send({
      amount: '10.50',
      currency: 'usd',
      merchantId: 'merchant-1',
    });

    expect(response.status).toBe(201);
    expect(capturedPayload).toEqual({
      amount: '10.50',
      currency: 'USD',
      merchantId: 'merchant-1',
    });
  });

  test('returns 400 route error when GET /invoice/:id param is invalid', async () => {
    const getInvoiceControllerMock = jest.fn((_req: express.Request, res: express.Response) => {
      return res.status(200).json({ ok: true });
    });

    const app = createErrorHandlerApp(
      createInvoiceRoute({
        createInvoiceController: (_req, res) => res.status(201).json({ ok: true }),
        getInvoiceController: getInvoiceControllerMock as RequestHandler,
      }),
    );

    const response = await request(app).get('/invoice/not-an-object-id');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_ERROR');
    expect(Array.isArray(response.body.error.details?.issues)).toBe(true);
    expect(getInvoiceControllerMock).not.toHaveBeenCalled();
  });
});
