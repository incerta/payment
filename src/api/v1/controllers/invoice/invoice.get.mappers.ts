import { formatMinorToAmount } from '../../../../utils/money';
import type { InvoiceModel } from '../../../../models/invoice/invoice.types';
import type { GetInvoiceResponseDto } from '../../routes/invoice/invoice.types';

export const mapInvoiceToGetResponse = (invoice: InvoiceModel): GetInvoiceResponseDto => {
  return {
    invoiceId: invoice._id.toString(),
    status: invoice.status,
    currency: invoice.currency,
    amount: formatMinorToAmount(invoice.amountMinor),
    fee: formatMinorToAmount(invoice.feeMinor),
    amountToReceive: formatMinorToAmount(invoice.amountToReceiveMinor),
    credited: invoice.creditCount > 0,
  };
};
