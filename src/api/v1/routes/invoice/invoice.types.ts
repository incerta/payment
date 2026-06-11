export interface CreateInvoiceRequestDto {
  amount: string | number;
  currency: string;
  merchantId: string;
}

export interface CreateInvoiceResponseDto {
  invoiceId: string;
  status: 'pending';
  currency: string;
  amount: string;
  fee: string;
  amountToReceive: string;
}

export interface GetInvoiceResponseDto {
  invoiceId: string;
  status: 'pending' | 'paid' | 'failed';
  currency: string;
  amount: string;
  fee: string;
  amountToReceive: string;
  credited: boolean;
}
