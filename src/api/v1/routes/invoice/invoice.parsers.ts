import { RouteError } from '../../../../core/error';
import type { CreateInvoiceRequestDto } from './invoice.types';

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RouteError('Request body must be an object', { statusCode: 400 });
  }

  return value as Record<string, unknown>;
};

export const parseCreateInvoiceRequest = (body: unknown): CreateInvoiceRequestDto => {
  const objectBody = asObject(body);

  const amount = objectBody.amount;
  if (!(typeof amount === 'string' || typeof amount === 'number')) {
    throw new RouteError('amount must be string or number', { statusCode: 400 });
  }

  const merchantId = objectBody.merchantId;
  if (typeof merchantId !== 'string' || merchantId.trim().length === 0) {
    throw new RouteError('merchantId is required', { statusCode: 400 });
  }

  const currency = objectBody.currency;
  if (typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency)) {
    throw new RouteError('currency must be 3 letters', { statusCode: 400 });
  }

  return {
    amount,
    merchantId: merchantId.trim(),
    currency: currency.toUpperCase(),
  };
};

export const parseInvoiceIdParam = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new RouteError('invoice id param is required', { statusCode: 400 });
  }

  return value.trim();
};
