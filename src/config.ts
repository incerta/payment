import dotenv from 'dotenv'
import { resolve } from 'node:path'

export const OPEN_API_DOCS_PATH = resolve(process.cwd(), 'storage/docs/openapi.json')

dotenv.config()

const parseNumberEnv = (name: string, defaultValue: number): number => {
  const raw = process.env[name]
  if (raw === undefined) {
    return defaultValue
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric env ${name}`)
  }

  return parsed
}

const parseStringEnv = (name: string, defaultValue: string): string => {
  const raw = process.env[name]
  if (!raw || raw.trim().length === 0) {
    return defaultValue
  }

  return raw.trim()
}

export const config = {
  nodeEnv: parseStringEnv('NODE_ENV', 'development'),
  port: parseNumberEnv('PORT', 3000),
  mongodbUri: parseStringEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/accounting-api'),
  redisUrl: parseStringEnv('REDIS_URL', 'redis://127.0.0.1:6379'),
  webhookSecret: parseStringEnv('WEBHOOK_SECRET', 'super-secret-key'),
  webhookTimestampToleranceSec: parseNumberEnv('WEBHOOK_TIMESTAMP_TOLERANCE_SEC', 300),
  webhookNonceTtlSec: parseNumberEnv('WEBHOOK_NONCE_TTL_SEC', 300),
  defaultMerchantId: parseStringEnv('DEFAULT_MERCHANT_ID', 'merchant-demo'),
  defaultMerchantFeePercent: parseStringEnv('DEFAULT_MERCHANT_FEE_PERCENT', '0.029'),
}
