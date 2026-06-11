import express, { type NextFunction, type Request, type Response } from 'express';
import type Redis from 'ioredis';
import type { Logger } from 'winston';
import { BaseError } from './core/error';
import { InvoiceRepository } from './models/invoice/invoice.repository';
import { MerchantRepository } from './models/merchant/merchant.repository';
import { loadGlobalMiddleware } from './loaders/global-middleware';
import { loadRoutes } from './loaders/routes';
import { InvoiceService } from './services/invoice/invoice.service';
import {
  ReplayProtectionService,
  RedisNonceStore,
} from './services/replay-protection/replay-protection.service';
import { WebhookService } from './services/webhook/webhook.service';

export interface ApplicationDeps {
  invoiceService: InvoiceService;
  webhookService: WebhookService;
  replayProtectionService: ReplayProtectionService;
  webhookSecret: string;
  logger: Logger;
}

export interface BuildDepsParams {
  redisClient: Redis;
  webhookSecret: string;
  timestampToleranceSec: number;
  nonceTtlSec: number;
  logger: Logger;
}

export const buildApplicationDeps = (params: BuildDepsParams): ApplicationDeps => {
  const invoiceRepository = new InvoiceRepository();
  const merchantRepository = new MerchantRepository();

  const invoiceService = new InvoiceService(invoiceRepository, merchantRepository);
  const webhookService = new WebhookService(invoiceRepository);

  const nonceStore = new RedisNonceStore(params.redisClient);
  const replayProtectionService = new ReplayProtectionService(
    nonceStore,
    params.timestampToleranceSec,
    params.nonceTtlSec,
  );

  return {
    invoiceService,
    webhookService,
    replayProtectionService,
    webhookSecret: params.webhookSecret,
    logger: params.logger,
  };
};

export const createApp = (deps: ApplicationDeps) => {
  const app = express();

  loadGlobalMiddleware(app);
  loadRoutes(app, deps);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof BaseError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    deps.logger.error('Unhandled error', {
      error: error instanceof Error ? error.message : 'unknown',
    });

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });

  return app;
};
