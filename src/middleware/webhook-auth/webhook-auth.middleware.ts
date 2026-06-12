import type { RequestHandler } from 'express'
import { BaseError, MiddlewareError } from '../../core/error'
import { ReplayProtectionService } from '../../services/replay-protection/replay-protection.service'
import {
  RateLimitService,
  type TokenBucketPolicy,
} from '../../services/rate-limit/rate-limit.service'
import { verifyHmacSha256Signature } from '../../services/security/hmac.service'

export interface WebhookAuthMiddlewareDeps {
  webhookSecret: string
  replayProtectionService: ReplayProtectionService
  invalidSignatureRateLimit?: {
    rateLimitService: RateLimitService
    policy: TokenBucketPolicy
  }
}

export const createWebhookAuthMiddleware = ({
  webhookSecret,
  replayProtectionService,
  invalidSignatureRateLimit,
}: WebhookAuthMiddlewareDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const signature = req.header('X-Signature')
      const timestamp = req.header('X-Timestamp')
      const nonce = req.header('X-Nonce')

      if (!signature) {
        throw new MiddlewareError('Missing X-Signature', { statusCode: 401 })
      }

      if (!timestamp) {
        throw new MiddlewareError('Missing X-Timestamp', { statusCode: 401 })
      }

      if (!nonce) {
        throw new MiddlewareError('Missing X-Nonce', { statusCode: 401 })
      }

      const requestWithRawBody = req as typeof req & { rawBody?: Buffer }

      if (!requestWithRawBody.rawBody) {
        throw new MiddlewareError('Missing raw body for signature validation', { statusCode: 400 })
      }

      const isSignatureValid = verifyHmacSha256Signature({
        secret: webhookSecret,
        payload: requestWithRawBody.rawBody,
        providedSignature: signature,
      })

      if (!isSignatureValid) {
        if (invalidSignatureRateLimit) {
          const rateLimitResult = await invalidSignatureRateLimit.rateLimitService.check({
            scope: 'webhook:invalid-signature:ip',
            identifier: req.ip ?? 'unknown',
            policy: invalidSignatureRateLimit.policy,
          })

          if (!rateLimitResult.allowed) {
            res.setHeader('Retry-After', `${rateLimitResult.retryAfterSec}`)

            throw new MiddlewareError('Too many invalid webhook signatures', {
              statusCode: 429,
              details: {
                scope: 'webhook:invalid-signature:ip',
                retryAfterSec: rateLimitResult.retryAfterSec,
              },
            })
          }
        }

        throw new MiddlewareError('Invalid webhook signature', { statusCode: 401 })
      }

      replayProtectionService.validateTimestamp(timestamp)
      await replayProtectionService.ensureUniqueNonce(nonce)

      return next()
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error)
      }

      return next(new MiddlewareError('Webhook auth failed'))
    }
  }
}
