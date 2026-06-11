export interface MerchantModel {
  merchantId: string;
  feePercentPpm: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantCreateInput {
  merchantId: string;
  feePercentPpm: number;
}
