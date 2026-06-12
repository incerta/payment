import type { Express } from 'express'
import Redis from 'ioredis'
import IORedisMock from 'ioredis-mock'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { buildApplicationDeps, createApp } from '../../src/app'
import { connectDatabase, disconnectDatabase } from '../../src/loaders/database'
import { buildLogger } from '../../src/loaders/logger'
import { InvoiceModel } from '../../src/models/invoice/invoice.schema'
import { MerchantRepository } from '../../src/models/merchant/merchant.repository'
import { parseFeePercentToPpm } from '../../src/utils/money'

export const TEST_WEBHOOK_SECRET = 'integration-secret'
export const TEST_MERCHANT_ID = 'merchant-it'

interface RedisLike {
  flushall: () => Promise<unknown>
  quit: () => Promise<unknown>
}

export interface IntegrationTestContext {
  app: Express
  mongo: MongoMemoryServer
  redis: RedisLike
  cleanup: () => Promise<void>
}

export const createIntegrationTestContext = async (): Promise<IntegrationTestContext> => {
  const mongo = await MongoMemoryServer.create()
  await connectDatabase(mongo.getUri())

  const redis = new IORedisMock()

  const merchantRepository = new MerchantRepository()
  await merchantRepository.upsert({
    merchantId: TEST_MERCHANT_ID,
    feePercentPpm: parseFeePercentToPpm('0.029'),
  })

  const deps = buildApplicationDeps({
    redisClient: redis as unknown as Redis,
    webhookSecret: TEST_WEBHOOK_SECRET,
    timestampToleranceSec: 300,
    nonceTtlSec: 300,
    rateLimitPolicies: {
      createInvoicePerMerchant: {
        capacity: 20,
        refillTokens: 60,
        refillPeriodSec: 60,
      },
      createInvoicePerIp: {
        capacity: 40,
        refillTokens: 120,
        refillPeriodSec: 60,
      },
      getInvoicePerIp: {
        capacity: 40,
        refillTokens: 120,
        refillPeriodSec: 60,
      },
      webhookPerIp: {
        capacity: 100,
        refillTokens: 300,
        refillPeriodSec: 60,
      },
      webhookInvalidSignaturePerIp: {
        capacity: 10,
        refillTokens: 10,
        refillPeriodSec: 60,
      },
    },
    logger: buildLogger(),
  })

  const app = createApp(deps)

  return {
    app,
    mongo,
    redis,
    cleanup: async () => {
      await InvoiceModel.deleteMany({})
      await redis.quit()
      await disconnectDatabase()
      await mongo.stop()
    },
  }
}
