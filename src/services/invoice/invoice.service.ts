import { ServiceError } from '../../core/error'
import { calculateFeeMinor, parseAmountToMinor } from '../../utils/money'
import { InvoiceRepository } from '../../models/invoice/invoice.repository'
import { MerchantRepository } from '../../models/merchant/merchant.repository'
import type { InvoiceModel } from '../../models/invoice/invoice.types'

export interface CreateInvoiceInput {
  amount: string | number
  currency: string
  merchantId: string
}

export class InvoiceService {
  public constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly merchantRepository: MerchantRepository,
  ) {}

  public async createInvoice(input: CreateInvoiceInput): Promise<InvoiceModel> {
    const merchant = await this.merchantRepository.findByMerchantId(input.merchantId)
    if (!merchant) {
      throw new ServiceError('Merchant not found', {
        statusCode: 404,
        details: { merchantId: input.merchantId },
      })
    }

    let amountMinor: number
    try {
      amountMinor = parseAmountToMinor(input.amount)
    } catch (error) {
      throw new ServiceError('Invalid amount', {
        statusCode: 400,
        details: {
          amount: input.amount,
          error: error instanceof Error ? error.message : 'unknown',
        },
      })
    }

    const feeMinor = calculateFeeMinor(amountMinor, merchant.feePercentPpm)
    const amountToReceiveMinor = amountMinor - feeMinor

    return this.invoiceRepository.createPending({
      merchantId: input.merchantId,
      currency: input.currency,
      amountMinor,
      feeMinor,
      amountToReceiveMinor,
    })
  }

  public async getInvoiceById(id: string): Promise<InvoiceModel> {
    const invoice = await this.invoiceRepository.findById(id)

    if (!invoice) {
      throw new ServiceError('Invoice not found', {
        statusCode: 404,
        details: { id },
      })
    }

    return invoice
  }
}
