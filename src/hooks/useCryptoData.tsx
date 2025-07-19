import { useState, useEffect } from 'react';

interface CryptoData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

interface UseCryptoDataReturn {
  cryptoData: CryptoData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const COINMARKETCAP_API_KEY = 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c'; // Public demo key

export const useCryptoData = (limit: number = 20): UseCryptoDataReturn => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=USD`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCryptoData(data.data || []);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      setError('Failed to fetch crypto data');
      // Fallback to mock data for development
      setCryptoData([
        {
          id: 1,
          name: 'Bitcoin',
          symbol: 'BTC',
          quote: {
            USD: {
              price: 68523.45,
              percent_change_24h: 5.2,
              market_cap: 1340000000000,
              volume_24h: 45000000000,
            },
          },
        },
        {
          id: 1027,
          name: 'Ethereum',
          symbol: 'ETH',
          quote: {
            USD: {
              price: 3847.23,
              percent_change_24h: 3.8,
              market_cap: 462000000000,
              volume_24h: 23000000000,
            },
          },
        },
        {
          id: 825,
          name: 'Tether',
          symbol: 'USDT',
          quote: {
            USD: {
              price: 1.00,
              percent_change_24h: 0.02,
              market_cap: 98000000000,
              volume_24h: 67000000000,
            },
          },
        },
        {
          id: 1839,
          name: 'BNB',
          symbol: 'BNB',
          quote: {
            USD: {
              price: 635.42,
              percent_change_24h: -2.1,
              market_cap: 92000000000,
              volume_24h: 1800000000,
            },
          },
        },
        {
          id: 74,
          name: 'Dogecoin',
          symbol: 'DOGE',
          quote: {
            USD: {
              price: 0.384,
              percent_change_24h: 8.7,
              market_cap: 56000000000,
              volume_24h: 4200000000,
            },
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchCryptoData, 30000);
    
    return () => clearInterval(interval);
  }, [limit]);

  return {
    cryptoData,
    loading,
    error,
    refetch: fetchCryptoData,
  };
};