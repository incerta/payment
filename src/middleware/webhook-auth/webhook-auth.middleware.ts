import type { RequestHandler } from 'express';
import { BaseError, MiddlewareError } from '../../core/error';
import { ReplayProtectionService } from '../../services/replay-protection/replay-protection.service';
import { verifyHmacSha256Signature } from '../../services/security/hmac.service';

export interface WebhookAuthMiddlewareDeps {
  webhookSecret: string;
  replayProtectionService: ReplayProtectionService;
}

export const createWebhookAuthMiddleware = ({
  webhookSecret,
  replayProtectionService,
}: WebhookAuthMiddlewareDeps): RequestHandler => {
  return async (req, _res, next) => {
    try {
      const signature = req.header('X-Signature');
      const timestamp = req.header('X-Timestamp');
      const nonce = req.header('X-Nonce');

      if (!signature) {
        throw new MiddlewareError('Missing X-Signature', { statusCode: 401 });
      }

      if (!timestamp) {
        throw new MiddlewareError('Missing X-Timestamp', { statusCode: 401 });
      }

      if (!nonce) {
        throw new MiddlewareError('Missing X-Nonce', { statusCode: 401 });
      }

      const requestWithRawBody = req as typeof req & { rawBody?: Buffer };

      if (!requestWithRawBody.rawBody) {
        throw new MiddlewareError('Missing raw body for signature validation', { statusCode: 400 });
      }

      const isSignatureValid = verifyHmacSha256Signature({
        secret: webhookSecret,
        payload: requestWithRawBody.rawBody,
        providedSignature: signature,
      });

      if (!isSignatureValid) {
        throw new MiddlewareError('Invalid webhook signature', { statusCode: 401 });
      }

      replayProtectionService.validateTimestamp(timestamp);
      await replayProtectionService.ensureUniqueNonce(nonce);

      return next();
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error);
      }

      return next(new MiddlewareError('Webhook auth failed'));
    }
  };
};
