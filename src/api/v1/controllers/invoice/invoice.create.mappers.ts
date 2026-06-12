import { formatMinorToAmount } from '../../../../utils/money'
import type { InvoiceModel } from '../../../../models/invoice/invoice.types'
import type { CreateInvoiceResponseDto } from '../../dto/invoice/invoice.dto'

export const mapInvoiceToCreateResponse = (invoice: InvoiceModel): CreateInvoiceResponseDto => {
  return {
    invoiceId: invoice._id.toString(),
    status: 'pending',
    currency: invoice.currency,
    amount: formatMinorToAmount(invoice.amountMinor),
    fee: formatMinorToAmount(invoice.feeMinor),
    amountToReceive: formatMinorToAmount(invoice.amountToReceiveMinor),
  }
}
