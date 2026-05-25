import { describe, it, expect } from 'vitest';
import { convertUsdToCurrencyAmount, validateAmountDecimals } from './money';

describe('money', () => {
  it('validates decimals by currency', () => {
    expect(validateAmountDecimals(100, 'IDR')).toBe(true);
    expect(validateAmountDecimals(100.1, 'IDR')).toBe(false);
    expect(validateAmountDecimals(100.12, 'USD')).toBe(true);
    expect(validateAmountDecimals(100.123, 'USD')).toBe(false);
  });

  it('converts USD to IDR with integer rounding', () => {
    expect(convertUsdToCurrencyAmount(1.23, 'IDR', 1000)).toBe(1230);
  });
});

