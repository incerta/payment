import { RepositoryError } from '../../core/error'
import { MerchantModel } from './merchant.schema'
import type { MerchantCreateInput, MerchantModel as MerchantEntity } from './merchant.types'

export class MerchantRepository {
  public async findByMerchantId(merchantId: string): Promise<MerchantEntity | null> {
    try {
      const merchant = await MerchantModel.findOne({ merchantId }).lean<MerchantEntity | null>()
      return merchant
    } catch (error) {
      throw new RepositoryError('Failed to fetch merchant by merchantId', {
        details: { merchantId, error: error instanceof Error ? error.message : 'unknown' },
      })
    }
  }

  public async upsert(input: MerchantCreateInput): Promise<void> {
    try {
      await MerchantModel.updateOne(
        { merchantId: input.merchantId },
        {
          $set: {
            feePercentPpm: input.feePercentPpm,
          },
        },
        { upsert: true },
      )
    } catch (error) {
      throw new RepositoryError('Failed to upsert merchant', {
        details: { input, error: error instanceof Error ? error.message : 'unknown' },
      })
    }
  }
}
