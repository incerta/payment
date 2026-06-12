import Redis from 'ioredis'
import { createServer } from 'node:http'
import { buildApplicationDeps, createApp } from './app'
import { config } from './config'
import { connectDatabase, disconnectDatabase } from './loaders/database'
import { buildLogger } from './loaders/logger'
import { MerchantRepository } from './models/merchant/merchant.repository'
import { parseFeePercentToPpm } from './utils/money'

const bootstrap = async (): Promise<void> => {
  const logger = buildLogger()
  await connectDatabase(config.mongodbUri)

  const redis = new Redis(config.redisUrl)

  const merchantRepository = new MerchantRepository()
  await merchantRepository.upsert({
    merchantId: config.defaultMerchantId,
    feePercentPpm: parseFeePercentToPpm(config.defaultMerchantFeePercent),
  })

  const enableRequestLogging = config.nodeEnv === 'development'

  const appDeps = buildApplicationDeps({
    redisClient: redis,
    webhookSecret: config.webhookSecret,
    timestampToleranceSec: config.webhookTimestampToleranceSec,
    nonceTtlSec: config.webhookNonceTtlSec,
    logger,
    enableRequestLogging,
  })

  const app = createApp(appDeps)
  const server = createServer(app)

  server.listen(config.port, () => {
    logger.info('Server started', { port: config.port })
  })

  const shutdown = async () => {
    server.close(async () => {
      await redis.quit()
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap app', error)
  process.exit(1)
})
