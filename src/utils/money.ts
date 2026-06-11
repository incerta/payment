const MINOR_UNITS_FACTOR = 100;
const PPM_FACTOR = 1_000_000n;

const normalizeNumericString = (value: string | number): string => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Numeric value is not finite');
    }

    return value.toString();
  }

  return value.trim();
};

export const parseAmountToMinor = (value: string | number): number => {
  const normalized = normalizeNumericString(value);

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('Amount must be a positive decimal with up to 2 fractional digits');
  }

  const [wholePartRaw, fractionalPartRaw = ''] = normalized.split('.');
  const wholePart = Number.parseInt(wholePartRaw, 10);
  const fractionalPart = Number.parseInt(fractionalPartRaw.padEnd(2, '0'), 10);

  const minor = wholePart * MINOR_UNITS_FACTOR + fractionalPart;

  if (!Number.isSafeInteger(minor) || minor <= 0) {
    throw new Error('Amount is out of supported range');
  }

  return minor;
};

export const formatMinorToAmount = (minor: number): string => {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new Error('Minor amount is invalid');
  }

  const whole = Math.floor(minor / MINOR_UNITS_FACTOR);
  const fractional = minor % MINOR_UNITS_FACTOR;

  return `${whole}.${fractional.toString().padStart(2, '0')}`;
};

export const parseFeePercentToPpm = (value: string | number): number => {
  const normalized = normalizeNumericString(value);

  if (!/^(0|1|0?\.\d{1,6}|1\.0{1,6})$/.test(normalized)) {
    throw new Error('Fee percent must be in [0..1] with up to 6 fractional digits');
  }

  const [wholePartRaw, fractionalPartRaw = ''] = normalized.split('.');
  const wholePart = Number.parseInt(wholePartRaw, 10);
  const fractionalPadded = fractionalPartRaw.padEnd(6, '0');

  if (wholePart === 1 && /[1-9]/.test(fractionalPadded)) {
    throw new Error('Fee percent cannot exceed 1');
  }

  const ppm = wholePart * 1_000_000 + Number.parseInt(fractionalPadded, 10);

  if (!Number.isSafeInteger(ppm) || ppm < 0 || ppm > 1_000_000) {
    throw new Error('Fee percent is out of range');
  }

  return ppm;
};

export const calculateFeeMinor = (amountMinor: number, feePercentPpm: number): number => {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new Error('amountMinor is invalid');
  }

  if (!Number.isSafeInteger(feePercentPpm) || feePercentPpm < 0 || feePercentPpm > 1_000_000) {
    throw new Error('feePercentPpm is invalid');
  }

  const numerator = BigInt(amountMinor) * BigInt(feePercentPpm) + PPM_FACTOR / 2n;
  const fee = Number(numerator / PPM_FACTOR);

  if (!Number.isSafeInteger(fee)) {
    throw new Error('Fee is out of supported range');
  }

  return fee;
};
