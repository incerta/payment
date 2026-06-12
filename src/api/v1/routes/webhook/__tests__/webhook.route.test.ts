import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { BaseError } from '../../../../../core/error';
import { createWebhookRoute } from '../webhook.route';

describe('webhook route', () => {
  const passAuthMiddleware: RequestHandler = (_req, _res, next) => next();

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

  test('returns 400 route error when POST /webhook payload is invalid', async () => {
    const webhookControllerMock = jest.fn((_req: express.Request, res: express.Response) => {
      return res.status(200).json({ ok: true });
    });

    const app = createErrorHandlerApp(
      createWebhookRoute({
        webhookAuthMiddleware: passAuthMiddleware,
        webhookController: webhookControllerMock as RequestHandler,
      }),
    );

    const response = await request(app)
      .post('/webhook')
      .send({ invoiceId: 'bad-id', status: 'paid' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('ROUTE_ERROR');
    expect(Array.isArray(response.body.error.details?.issues)).toBe(true);
    expect(webhookControllerMock).not.toHaveBeenCalled();
  });

  test('passes validated payload through req.body for POST /webhook', async () => {
    let capturedPayload: unknown;

    const webhookController: RequestHandler = (req, res) => {
      capturedPayload = req.body;
      return res.status(200).json({
        invoiceId: '507f1f77bcf86cd799439011',
        status: 'paid',
        creditedNow: true,
      });
    };

    const app = createErrorHandlerApp(
      createWebhookRoute({
        webhookAuthMiddleware: passAuthMiddleware,
        webhookController,
      }),
    );

    const response = await request(app).post('/webhook').send({
      invoiceId: '507f1f77bcf86cd799439011',
      status: 'paid',
    });

    expect(response.status).toBe(200);
    expect(capturedPayload).toEqual({
      invoiceId: '507f1f77bcf86cd799439011',
      status: 'paid',
    });
  });
});
