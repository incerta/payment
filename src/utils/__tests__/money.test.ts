import { calculateFeeMinor, parseAmountToMinor, parseFeePercentToPpm } from '../money';

describe('money utils', () => {
  test('calculates fee and amountToReceive exactly for 100.00 and 0.029', () => {
    const amountMinor = parseAmountToMinor('100.00');
    const feePercentPpm = parseFeePercentToPpm('0.029');

    const feeMinor = calculateFeeMinor(amountMinor, feePercentPpm);
    const amountToReceiveMinor = amountMinor - feeMinor;

    expect(feeMinor).toBe(290);
    expect(amountToReceiveMinor).toBe(9710);
  });

  test('rounds half-up to cent', () => {
    const amountMinor = parseAmountToMinor('0.01');
    const feePercentPpm = parseFeePercentToPpm('0.5');

    const feeMinor = calculateFeeMinor(amountMinor, feePercentPpm);

    expect(feeMinor).toBe(1);
  });

  test('rejects invalid amount', () => {
    expect(() => parseAmountToMinor('-1.00')).toThrow('Amount must be a positive decimal');
  });
});
