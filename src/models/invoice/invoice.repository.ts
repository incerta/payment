import { Types } from 'mongoose';
import { RepositoryError } from '../../core/error';
import { InvoiceModel } from './invoice.schema';
import type { InvoiceCreateInput, InvoiceModel as InvoiceEntity, PaidApplyResult } from './invoice.types';

const toObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new RepositoryError('Invalid invoice id', {
      statusCode: 400,
      details: { id },
    });
  }

  return new Types.ObjectId(id);
};

export class InvoiceRepository {
  public async createPending(input: InvoiceCreateInput): Promise<InvoiceEntity> {
    try {
      const document = await InvoiceModel.create({
        ...input,
        status: 'pending',
        creditCount: 0,
        creditedAt: null,
      });

      return document.toObject() as InvoiceEntity;
    } catch (error) {
      throw new RepositoryError('Failed to create invoice', {
        details: { input, error: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  public async findById(id: string): Promise<InvoiceEntity | null> {
    try {
      const invoice = await InvoiceModel.findById(toObjectId(id)).lean<InvoiceEntity | null>();
      return invoice;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw new RepositoryError('Failed to get invoice by id', {
        details: { id, error: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  public async applyPaidOnce(id: string): Promise<PaidApplyResult | null> {
    try {
      const objectId = toObjectId(id);
      const now = new Date();

      const paidInvoice = await InvoiceModel.findOneAndUpdate(
        {
          _id: objectId,
          creditCount: 0,
        },
        {
          $set: {
            status: 'paid',
            creditedAt: now,
          },
          $inc: {
            creditCount: 1,
          },
        },
        { new: true },
      ).lean<InvoiceEntity | null>();

      if (paidInvoice) {
        return {
          invoice: paidInvoice,
          creditedNow: true,
        };
      }

      const existingInvoice = await InvoiceModel.findById(objectId).lean<InvoiceEntity | null>();
      if (!existingInvoice) {
        return null;
      }

      return {
        invoice: existingInvoice,
        creditedNow: false,
      };
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw new RepositoryError('Failed to apply paid status', {
        details: { id, error: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  public async applyFailed(id: string): Promise<InvoiceEntity | null> {
    try {
      const objectId = toObjectId(id);

      const failedInvoice = await InvoiceModel.findOneAndUpdate(
        {
          _id: objectId,
          creditCount: 0,
          status: { $ne: 'paid' },
        },
        {
          $set: {
            status: 'failed',
          },
        },
        { new: true },
      ).lean<InvoiceEntity | null>();

      if (failedInvoice) {
        return failedInvoice;
      }

      const existingInvoice = await InvoiceModel.findById(objectId).lean<InvoiceEntity | null>();
      return existingInvoice;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw new RepositoryError('Failed to apply failed status', {
        details: { id, error: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }
}
