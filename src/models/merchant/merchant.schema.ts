import { Schema, model } from 'mongoose';

interface MerchantSchemaType {
  merchantId: string;
  feePercentPpm: number;
  createdAt: Date;
  updatedAt: Date;
}

const merchantSchema = new Schema<MerchantSchemaType>(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    feePercentPpm: {
      type: Number,
      required: true,
      min: 0,
      max: 1_000_000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const MerchantModel = model<MerchantSchemaType>('Merchant', merchantSchema);
