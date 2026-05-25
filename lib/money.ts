import type { CurrencyCode } from '../types';

export const currencyDecimals: Record<CurrencyCode, number> = {
  USD: 2,
  IDR: 0,
};

export function assertCurrencyCode(code: string): CurrencyCode {
  if (code === 'USD' || code === 'IDR') return code;
  return 'USD';
}

export function toMinorUnits(amount: number, currency: CurrencyCode): bigint {
  if (!Number.isFinite(amount)) throw new Error('Invalid amount');
  const decimals = currencyDecimals[currency];
  const factor = 10 ** decimals;
  const scaled = Math.round(amount * factor);
  return BigInt(scaled);
}

export function fromMinorUnits(minor: bigint, currency: CurrencyCode): number {
  const decimals = currencyDecimals[currency];
  const factor = 10 ** decimals;
  return Number(minor) / factor;
}

export function convertUsdToIdrMinor(usdCents: bigint, usdIdrRate: number): bigint {
  if (!Number.isFinite(usdIdrRate) || usdIdrRate <= 0) throw new Error('Invalid fx rate');
  const rateMicro = BigInt(Math.round(usdIdrRate * 1_000_000));
  const numerator = usdCents * rateMicro;
  const denom = BigInt(100_000_000);
  return (numerator + denom / BigInt(2)) / denom;
}

export function convertUsdToCurrencyAmount(usdAmount: number, currency: CurrencyCode, usdIdrRate: number): number {
  if (currency === 'USD') return normalizeAmount(usdAmount, 'USD');
  const usdCents = toMinorUnits(usdAmount, 'USD');
  const idr = convertUsdToIdrMinor(usdCents, usdIdrRate);
  return fromMinorUnits(idr, 'IDR');
}

export function normalizeAmount(amount: number, currency: CurrencyCode): number {
  const decimals = currencyDecimals[currency];
  const factor = 10 ** decimals;
  return Math.round(amount * factor) / factor;
}

export function validateAmountDecimals(amount: number, currency: CurrencyCode): boolean {
  const normalized = normalizeAmount(amount, currency);
  return Math.abs(normalized - amount) < 1e-9;
}

