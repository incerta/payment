import { Schema, model } from 'mongoose';
import type { InvoiceStatus } from './invoice.types';

interface InvoiceSchemaType {
  merchantId: string;
  currency: string;
  amountMinor: number;
  feeMinor: number;
  amountToReceiveMinor: number;
  status: InvoiceStatus;
  creditCount: number;
  creditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<InvoiceSchemaType>(
  {
    merchantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
    },
    feeMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    amountToReceiveMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },
    creditCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const InvoiceModel = model<InvoiceSchemaType>('Invoice', invoiceSchema);
