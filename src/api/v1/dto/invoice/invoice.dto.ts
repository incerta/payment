import { z } from 'zod';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const REQUEST_AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;
const RESPONSE_AMOUNT_REGEX = /^\d+\.\d{2}$/;
const MAX_SAFE_AMOUNT = Number.MAX_SAFE_INTEGER / 100;

const invoiceIdSchema = z.string().trim().length(24).regex(OBJECT_ID_REGEX);
const currencySchema = z
  .string()
  .trim()
  .length(3)
  .regex(/^[A-Za-z]{3}$/)
  .transform((value) => value.toUpperCase());
const responseCurrencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/);
const responseAmountSchema = z.string().trim().min(4).max(32).regex(RESPONSE_AMOUNT_REGEX);

export const createInvoiceRequestSchema = z.object({
  amount: z.union([
    z.string().trim().min(1).max(32).regex(REQUEST_AMOUNT_REGEX),
    z.number().finite().gt(0).max(MAX_SAFE_AMOUNT),
  ]),
  currency: currencySchema,
  merchantId: z.string().trim().min(1).max(128),
});

export const createInvoiceResponseSchema = z.object({
  invoiceId: invoiceIdSchema,
  status: z.literal('pending'),
  currency: responseCurrencySchema,
  amount: responseAmountSchema,
  fee: responseAmountSchema,
  amountToReceive: responseAmountSchema,
});

export const getInvoiceParamsSchema = z.object({
  id: invoiceIdSchema,
});

export const getInvoiceResponseSchema = z.object({
  invoiceId: invoiceIdSchema,
  status: z.enum(['pending', 'paid', 'failed']),
  currency: responseCurrencySchema,
  amount: responseAmountSchema,
  fee: responseAmountSchema,
  amountToReceive: responseAmountSchema,
  credited: z.boolean(),
});

export type CreateInvoiceRequestDto = z.infer<typeof createInvoiceRequestSchema>;
export type CreateInvoiceResponseDto = z.infer<typeof createInvoiceResponseSchema>;
export type GetInvoiceParamsDto = z.infer<typeof getInvoiceParamsSchema>;
export type GetInvoiceResponseDto = z.infer<typeof getInvoiceResponseSchema>;
