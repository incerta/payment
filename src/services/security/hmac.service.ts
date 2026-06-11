import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_PREFIX = 'sha256=';

const normalizeSignature = (signature: string): string =>
  signature.startsWith(SIGNATURE_PREFIX) ? signature.slice(SIGNATURE_PREFIX.length) : signature;

export const computeHmacSha256Hex = (secret: string, payload: Buffer | string): string => {
  return createHmac('sha256', secret).update(payload).digest('hex');
};

export const verifyHmacSha256Signature = (params: {
  secret: string;
  payload: Buffer | string;
  providedSignature: string;
}): boolean => {
  const expected = computeHmacSha256Hex(params.secret, params.payload);
  const provided = normalizeSignature(params.providedSignature);

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(provided, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
};
