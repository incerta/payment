import { computeHmacSha256Hex, verifyHmacSha256Signature } from '../hmac.service';

describe('hmac service', () => {
  const secret = 'test-secret';

  test('accepts valid signature', () => {
    const payload = Buffer.from('{"invoiceId":"a","status":"paid"}');
    const signature = computeHmacSha256Hex(secret, payload);

    expect(
      verifyHmacSha256Signature({
        secret,
        payload,
        providedSignature: signature,
      }),
    ).toBe(true);
  });

  test('rejects signature if raw body changed', () => {
    const payload = Buffer.from('{"invoiceId":"a","status":"paid"}');
    const tamperedPayload = Buffer.from('{"invoiceId":"a","status":"failed"}');
    const signature = computeHmacSha256Hex(secret, payload);

    expect(
      verifyHmacSha256Signature({
        secret,
        payload: tamperedPayload,
        providedSignature: signature,
      }),
    ).toBe(false);
  });
});
