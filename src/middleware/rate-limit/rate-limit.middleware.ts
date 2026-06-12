import type { Request, RequestHandler } from 'express'
import { BaseError, MiddlewareError } from '../../core/error'
import {
  RateLimitService,
  type TokenBucketPolicy,
} from '../../services/rate-limit/rate-limit.service'

export interface RateLimitMiddlewareDeps {
  rateLimitService: RateLimitService
  scope: string
  policy: TokenBucketPolicy
  resolveIdentifier: (req: Request) => string
  exceededMessage?: string
}

export const createRateLimitMiddleware = ({
  rateLimitService,
  scope,
  policy,
  resolveIdentifier,
  exceededMessage,
}: RateLimitMiddlewareDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const resolved = resolveIdentifier(req)
      const identifier = resolved.trim().length > 0 ? resolved : 'unknown'

      const decision = await rateLimitService.check({
        scope,
        identifier,
        policy,
      })

      res.setHeader('X-RateLimit-Remaining', `${decision.remaining}`)

      if (!decision.allowed) {
        res.setHeader('Retry-After', `${decision.retryAfterSec}`)

        throw new MiddlewareError(exceededMessage ?? 'Rate limit exceeded', {
          statusCode: 429,
          details: {
            scope,
            retryAfterSec: decision.retryAfterSec,
          },
        })
      }

      return next()
    } catch (error) {
      if (error instanceof BaseError) {
        return next(error)
      }

      return next(
        new MiddlewareError('Rate limiter failed', {
          statusCode: 500,
        }),
      )
    }
  }
}
