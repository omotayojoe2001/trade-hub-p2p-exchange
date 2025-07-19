import { useState, useEffect } from 'react';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyData {
  rates: ExchangeRates;
  base: string;
  lastUpdated: string;
}

export const useCurrencyConverter = () => {
  const [rates, setRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const fetchRates = async (base: string = 'USD') => {
    try {
      setLoading(true);
      const response = await fetch(`https://v6.exchangerate-api.com/v6/518e7ec47fe13c382a7bd01d/latest/${base}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      setRates(data.conversion_rates);
      setBaseCurrency(base);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return amount;
    }
    
    // Convert to base currency first, then to target currency
    const baseAmount = baseCurrency === fromCurrency ? amount : amount / rates[fromCurrency];
    return baseCurrency === toCurrency ? baseAmount : baseAmount * rates[toCurrency];
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return {
    rates,
    loading,
    error,
    baseCurrency,
    fetchRates,
    convertCurrency,
    formatCurrency,
    setBaseCurrency: (currency: string) => fetchRates(currency),
  };
};