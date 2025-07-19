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

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const useCryptoData = (limit: number = 20): UseCryptoDataReturn => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use CoinGecko API which supports CORS
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform CoinGecko data to match our interface
      const transformedData = data.map((coin: any) => ({
        id: parseInt(coin.market_cap_rank) || 0,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        quote: {
          USD: {
            price: coin.current_price,
            percent_change_24h: coin.price_change_percentage_24h || 0,
            market_cap: coin.market_cap,
            volume_24h: coin.total_volume,
          },
        },
      }));
      
      setCryptoData(transformedData);
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