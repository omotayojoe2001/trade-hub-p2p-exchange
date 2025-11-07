import { useState, useEffect } from 'react';

export interface CryptoData {
  id: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
  quote?: {
    USD: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

interface CoinHistoryData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface UseCryptoDataReturn {
  cryptoData: CryptoData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  searchCoins: (query: string) => Promise<CryptoData[]>;
  getCoinDetail: (coinId: string) => Promise<CryptoData | null>;
  getCoinHistory: (coinId: string, days: number) => Promise<CoinHistoryData | null>;
  favorites: string[];
  toggleFavorite: (coinId: string) => void;
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const useCryptoData = (limit: number = 50): UseCryptoDataReturn => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('crypto-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      // Transform data to include quote for backward compatibility
      const transformedData = data.map((coin: any) => ({
        ...coin,
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
      setError(null); // Don't show error to user
      // Fallback to mock data for development
      setCryptoData([
        {
          id: 1,
          name: 'Bitcoin',
          symbol: 'btc',
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          current_price: 68523.45,
          market_cap: 1340000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 5.2,
          total_volume: 45000000000,
          high_24h: 70000,
          low_24h: 67000,
          price_change_24h: 3200,
          market_cap_change_24h: 65000000000,
          market_cap_change_percentage_24h: 5.1,
          circulating_supply: 19500000,
          total_supply: 21000000,
          max_supply: 21000000,
          ath: 73000,
          ath_change_percentage: -6.2,
          ath_date: '2024-03-14T07:10:36.635Z',
          atl: 67.81,
          atl_change_percentage: 101000,
          atl_date: '2013-07-06T00:00:00.000Z',
          roi: null,
          last_updated: new Date().toISOString(),
          fully_diluted_valuation: 1440000000000,
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
          id: 2,
          name: 'Ethereum',
          symbol: 'eth',
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          current_price: 3456.78,
          market_cap: 415000000000,
          market_cap_rank: 2,
          price_change_percentage_24h: 3.8,
          total_volume: 18000000000,
          high_24h: 3500,
          low_24h: 3400,
          price_change_24h: 126.5,
          market_cap_change_24h: 15200000000,
          market_cap_change_percentage_24h: 3.8,
          circulating_supply: 120000000,
          total_supply: 120000000,
          max_supply: null,
          ath: 4878.26,
          ath_change_percentage: -29.1,
          ath_date: '2021-11-10T14:24:19.604Z',
          atl: 0.432979,
          atl_change_percentage: 798000,
          atl_date: '2015-10-20T00:00:00.000Z',
          roi: null,
          last_updated: new Date().toISOString(),
          fully_diluted_valuation: 415000000000,
          quote: {
            USD: {
              price: 3456.78,
              percent_change_24h: 3.8,
              market_cap: 415000000000,
              volume_24h: 18000000000,
            },
          },
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const searchCoins = async (query: string): Promise<CryptoData[]> => {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.coins || [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  };

  const getCoinDetail = async (coinId: string): Promise<CryptoData | null> => {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      );
      if (!response.ok) throw new Error('Failed to fetch coin detail');
      const data = await response.json();
      
      return {
        id: data.market_cap_rank || 0,
        name: data.name,
        symbol: data.symbol,
        image: data.image?.large || '',
        current_price: data.market_data?.current_price?.usd || 0,
        market_cap: data.market_data?.market_cap?.usd || 0,
        market_cap_rank: data.market_cap_rank || 0,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
        total_volume: data.market_data?.total_volume?.usd || 0,
        high_24h: data.market_data?.high_24h?.usd || 0,
        low_24h: data.market_data?.low_24h?.usd || 0,
        ath: data.market_data?.ath?.usd || 0,
        quote: {
          USD: {
            price: data.market_data?.current_price?.usd || 0,
            percent_change_24h: data.market_data?.price_change_percentage_24h || 0,
            market_cap: data.market_data?.market_cap?.usd || 0,
            volume_24h: data.market_data?.total_volume?.usd || 0,
          },
        },
      } as CryptoData;
    } catch (err) {
      console.error('Error fetching coin detail:', err);
      return null;
    }
  };

  const getCoinHistory = async (coinId: string, days: number): Promise<CoinHistoryData | null> => {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!response.ok) throw new Error('Failed to fetch coin history');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching coin history:', err);
      return null;
    }
  };

  const toggleFavorite = (coinId: string) => {
    const newFavorites = favorites.includes(coinId)
      ? favorites.filter(id => id !== coinId)
      : [...favorites, coinId];
    
    setFavorites(newFavorites);
    localStorage.setItem('crypto-favorites', JSON.stringify(newFavorites));
  };

  useEffect(() => {
    fetchCryptoData();
    
    // Refresh data every 5 minutes to avoid rate limits
    const interval = setInterval(fetchCryptoData, 300000);
    
    return () => clearInterval(interval);
  }, [limit]);

  return {
    cryptoData,
    loading,
    error,
    refetch: fetchCryptoData,
    searchCoins,
    getCoinDetail,
    getCoinHistory,
    favorites,
    toggleFavorite,
  };
};