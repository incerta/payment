import type Redis from 'ioredis'
import { ServiceError } from '../../core/error'

export interface TokenBucketPolicy {
  capacity: number
  refillTokens: number
  refillPeriodSec: number
}

export interface RateLimitCheckInput {
  scope: string
  identifier: string
  policy: TokenBucketPolicy
  nowMs?: number
}

export interface RateLimitDecision {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

export interface TokenBucketStore {
  consumeToken(input: {
    scope: string
    identifier: string
    policy: TokenBucketPolicy
    nowMs: number
  }): Promise<RateLimitDecision>
}

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refill_per_ms = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])
local ttl_ms = tonumber(ARGV[5])

local values = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(values[1])
local ts = tonumber(values[2])

if not tokens then
  tokens = capacity
  ts = now_ms
end

if now_ms > ts then
  local elapsed = now_ms - ts
  tokens = math.min(capacity, tokens + (elapsed * refill_per_ms))
  ts = now_ms
end

local allowed = 0
if tokens >= requested then
  tokens = tokens - requested
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'ts', ts)
redis.call('PEXPIRE', key, ttl_ms)

local remaining = math.floor(tokens)
local retry_after_ms = 0
if allowed == 0 then
  local needed = requested - tokens
  retry_after_ms = math.ceil(needed / refill_per_ms)
end

return { allowed, remaining, retry_after_ms }
`

export class RedisTokenBucketStore implements TokenBucketStore {
  private readonly keyPrefix: string

  public constructor(
    private readonly redis: Redis,
    keyPrefix = 'rate-limit',
  ) {
    this.keyPrefix = keyPrefix
  }

  public async consumeToken(input: {
    scope: string
    identifier: string
    policy: TokenBucketPolicy
    nowMs: number
  }): Promise<RateLimitDecision> {
    const { scope, identifier, policy, nowMs } = input

    validatePolicy(policy)

    const refillPerMs = policy.refillTokens / (policy.refillPeriodSec * 1000)
    const ttlMs = policy.refillPeriodSec * 2000
    const key = `${this.keyPrefix}:${scope}:${identifier}`

    try {
      const raw = await this.redis.eval(
        TOKEN_BUCKET_SCRIPT,
        1,
        key,
        `${nowMs}`,
        `${policy.capacity}`,
        `${refillPerMs}`,
        '1',
        `${ttlMs}`,
      )

      if (!Array.isArray(raw) || raw.length < 3) {
        throw new ServiceError('Invalid rate limit store response', {
          details: { scope, identifier, raw },
        })
      }

      const allowed = Number(raw[0]) === 1
      const remaining = Math.max(0, Math.floor(Number(raw[1])))
      const retryAfterMs = Math.max(0, Math.ceil(Number(raw[2])))

      return {
        allowed,
        remaining,
        retryAfterSec: Math.max(0, Math.ceil(retryAfterMs / 1000)),
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }

      throw new ServiceError('Failed to check rate limit', {
        details: {
          scope,
          identifier,
          error: error instanceof Error ? error.message : 'unknown',
        },
      })
    }
  }
}

export class RateLimitService {
  public constructor(private readonly tokenBucketStore: TokenBucketStore) {}

  public async check(input: RateLimitCheckInput): Promise<RateLimitDecision> {
    const nowMs = input.nowMs ?? Date.now()
    return this.tokenBucketStore.consumeToken({
      scope: input.scope,
      identifier: input.identifier,
      policy: input.policy,
      nowMs,
    })
  }
}

const validatePolicy = (policy: TokenBucketPolicy): void => {
  if (!Number.isFinite(policy.capacity) || policy.capacity <= 0) {
    throw new ServiceError('Invalid rate limit capacity', {
      details: { policy },
    })
  }

  if (!Number.isFinite(policy.refillTokens) || policy.refillTokens <= 0) {
    throw new ServiceError('Invalid rate limit refill tokens', {
      details: { policy },
    })
  }

  if (!Number.isFinite(policy.refillPeriodSec) || policy.refillPeriodSec <= 0) {
    throw new ServiceError('Invalid rate limit refill period', {
      details: { policy },
    })
  }
}
