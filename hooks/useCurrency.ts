
import { useCallback, useMemo } from 'react';
import { useStore, SUPPORTED_CURRENCIES } from '../store/useStore';
import type { CurrencyCode } from '../types';
import { convertUsdToCurrencyAmount, currencyDecimals, normalizeAmount } from '../lib/money';

export const useCurrency = () => {
  const { currency, setCurrency, fxRates } = useStore();

  const currentCurrency = useMemo(() => SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0], [currency]);

  const convertPrice = useCallback((priceInUsd: number) => {
    return convertUsdToCurrencyAmount(priceInUsd, currentCurrency.code as CurrencyCode, fxRates.usd_idr);
  }, [currentCurrency.code, fxRates.usd_idr]);

  const formatPrice = useCallback((priceInUsd: number) => {
    const converted = convertPrice(priceInUsd);
    const maximumFractionDigits = currencyDecimals[currentCurrency.code as CurrencyCode];

    return new Intl.NumberFormat(currentCurrency.locale, {
      style: 'currency',
      currency: currentCurrency.code,
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits,
    }).format(converted);
  }, [convertPrice, currentCurrency.code, currentCurrency.locale]);

  const formatAmount = useCallback((amount: number, currencyCode: CurrencyCode) => {
    const c = SUPPORTED_CURRENCIES.find(x => x.code === currencyCode) || SUPPORTED_CURRENCIES[0];
    const decimals = currencyDecimals[currencyCode];
    const normalized = normalizeAmount(amount, currencyCode);
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(normalized);
  }, []);

  return {
    currency: currentCurrency,
    setCurrency,
    formatPrice,
    convertPrice,
    formatAmount,
    allCurrencies: SUPPORTED_CURRENCIES
  };
};
