import type Redis from 'ioredis'
import IORedisMock from 'ioredis-mock'
import {
  RateLimitService,
  RedisTokenBucketStore,
  type TokenBucketPolicy,
} from '../rate-limit.service'

describe('rate limit service', () => {
  test('blocks requests when bucket is exhausted', async () => {
    const redis = new IORedisMock()
    const service = new RateLimitService(new RedisTokenBucketStore(redis as unknown as Redis))

    const policy: TokenBucketPolicy = {
      capacity: 2,
      refillTokens: 2,
      refillPeriodSec: 60,
    }

    const first = await service.check({
      scope: 'test',
      identifier: 'client-1',
      policy,
      nowMs: 0,
    })

    const second = await service.check({
      scope: 'test',
      identifier: 'client-1',
      policy,
      nowMs: 0,
    })

    const third = await service.check({
      scope: 'test',
      identifier: 'client-1',
      policy,
      nowMs: 0,
    })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSec).toBeGreaterThan(0)

    await redis.quit()
  })

  test('refills token bucket over time', async () => {
    const redis = new IORedisMock()
    const service = new RateLimitService(new RedisTokenBucketStore(redis as unknown as Redis))

    const policy: TokenBucketPolicy = {
      capacity: 2,
      refillTokens: 2,
      refillPeriodSec: 2,
    }

    await service.check({
      scope: 'test-refill',
      identifier: 'client-1',
      policy,
      nowMs: 0,
    })

    await service.check({
      scope: 'test-refill',
      identifier: 'client-1',
      policy,
      nowMs: 0,
    })

    const blocked = await service.check({
      scope: 'test-refill',
      identifier: 'client-1',
      policy,
      nowMs: 0,
    })

    const afterRefill = await service.check({
      scope: 'test-refill',
      identifier: 'client-1',
      policy,
      nowMs: 1000,
    })

    expect(blocked.allowed).toBe(false)
    expect(afterRefill.allowed).toBe(true)

    await redis.quit()
  })
})
