import type Redis from 'ioredis';
import { ServiceError } from '../../core/error';

export interface NonceStore {
  reserveNonce(nonce: string, ttlSec: number): Promise<boolean>;
}

export class RedisNonceStore implements NonceStore {
  private readonly keyPrefix: string;

  public constructor(
    private readonly redis: Redis,
    keyPrefix = 'webhook:nonce',
  ) {
    this.keyPrefix = keyPrefix;
  }

  public async reserveNonce(nonce: string, ttlSec: number): Promise<boolean> {
    const key = `${this.keyPrefix}:${nonce}`;
    const result = await this.redis.set(key, '1', 'EX', ttlSec, 'NX');
    return result === 'OK';
  }
}

export class ReplayProtectionService {
  public constructor(
    private readonly nonceStore: NonceStore,
    private readonly timestampToleranceSec: number,
    private readonly nonceTtlSec: number,
  ) {}

  public validateTimestamp(timestampHeader: string, nowSec = Math.floor(Date.now() / 1000)): number {
    const timestamp = Number.parseInt(timestampHeader, 10);

    if (!Number.isInteger(timestamp)) {
      throw new ServiceError('Invalid X-Timestamp', { statusCode: 401 });
    }

    const drift = Math.abs(nowSec - timestamp);
    if (drift > this.timestampToleranceSec) {
      throw new ServiceError('X-Timestamp is outside allowed time window', {
        statusCode: 401,
        details: { drift, tolerance: this.timestampToleranceSec },
      });
    }

    return timestamp;
  }

  public async ensureUniqueNonce(nonce: string): Promise<void> {
    if (!nonce || nonce.trim().length === 0) {
      throw new ServiceError('Missing X-Nonce', { statusCode: 401 });
    }

    const reserved = await this.nonceStore.reserveNonce(nonce, this.nonceTtlSec);
    if (!reserved) {
      throw new ServiceError('X-Nonce replay detected', { statusCode: 409 });
    }
  }
}
