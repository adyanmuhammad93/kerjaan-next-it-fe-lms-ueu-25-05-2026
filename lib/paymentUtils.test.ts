import { describe, it, expect } from 'vitest';
import { normalizeIndonesianPhone, isIntegerAmount } from './paymentUtils';

describe('payment utils', () => {
  it('normalizes Indonesian phone numbers to 62xxxxxxxxxx', () => {
    expect(normalizeIndonesianPhone('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeIndonesianPhone('+6281234567890')).toBe('6281234567890');
    expect(normalizeIndonesianPhone('6281234567890')).toBe('6281234567890');
  });

  it('validates integer amounts', () => {
    expect(isIntegerAmount(10000)).toBe(true);
    expect(isIntegerAmount(10000.5)).toBe(false);
  });
});

