export type InvoiceStatus = 'pending' | 'paid' | 'failed';

export interface InvoiceModel {
  _id: { toString(): string } | string;
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

export interface InvoiceCreateInput {
  merchantId: string;
  currency: string;
  amountMinor: number;
  feeMinor: number;
  amountToReceiveMinor: number;
}

export interface PaidApplyResult {
  invoice: InvoiceModel;
  creditedNow: boolean;
}
