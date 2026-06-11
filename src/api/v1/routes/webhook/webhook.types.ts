export type WebhookStatus = 'paid' | 'failed';

export interface WebhookRequestDto {
  invoiceId: string;
  status: WebhookStatus;
}

export interface WebhookResponseDto {
  invoiceId: string;
  status: WebhookStatus | 'pending';
  creditedNow: boolean;
}
