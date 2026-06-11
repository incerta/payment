import { ServiceError } from '../../core/error';
import { InvoiceRepository } from '../../models/invoice/invoice.repository';
import type { InvoiceModel, InvoiceStatus } from '../../models/invoice/invoice.types';

export interface ProcessWebhookInput {
  invoiceId: string;
  status: Extract<InvoiceStatus, 'paid' | 'failed'>;
}

export interface ProcessWebhookResult {
  invoice: InvoiceModel;
  creditedNow: boolean;
}

export class WebhookService {
  public constructor(private readonly invoiceRepository: InvoiceRepository) {}

  public async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    if (input.status === 'paid') {
      const paidResult = await this.invoiceRepository.applyPaidOnce(input.invoiceId);

      if (!paidResult) {
        throw new ServiceError('Invoice not found', {
          statusCode: 404,
          details: { invoiceId: input.invoiceId },
        });
      }

      return {
        invoice: paidResult.invoice,
        creditedNow: paidResult.creditedNow,
      };
    }

    const failedInvoice = await this.invoiceRepository.applyFailed(input.invoiceId);

    if (!failedInvoice) {
      throw new ServiceError('Invoice not found', {
        statusCode: 404,
        details: { invoiceId: input.invoiceId },
      });
    }

    return {
      invoice: failedInvoice,
      creditedNow: false,
    };
  }
}
