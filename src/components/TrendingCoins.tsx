import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCryptoData } from '@/hooks/useCryptoData';

const TrendingCoins = () => {
  const { cryptoData, loading, error } = useCryptoData(10);

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getCoinIcon = (symbol: string) => {
    const iconMap: { [key: string]: string } = {
      BTC: '₿',
      ETH: 'Ξ',
      USDT: '₮',
      BNB: 'B',
      DOGE: 'D',
      ADA: '₳',
      SOL: 'S',
      XRP: 'X',
      DOT: '●',
      AVAX: 'A',
    };
    return iconMap[symbol] || symbol.charAt(0);
  };

  const getCoinColor = (symbol: string) => {
    const colorMap: { [key: string]: string } = {
      BTC: 'text-orange-500 bg-orange-100',
      ETH: 'text-blue-500 bg-blue-100',
      USDT: 'text-green-500 bg-green-100',
      BNB: 'text-yellow-500 bg-yellow-100',
      DOGE: 'text-purple-500 bg-purple-100',
      ADA: 'text-indigo-500 bg-indigo-100',
      SOL: 'text-pink-500 bg-pink-100',
      XRP: 'text-gray-500 bg-gray-100',
      DOT: 'text-red-500 bg-red-100',
      AVAX: 'text-cyan-500 bg-cyan-100',
    };
    return colorMap[symbol] || 'text-gray-500 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-orange-400 text-lg mr-2">🔥</span>
            <h2 className="text-gray-900 text-lg font-semibold">Trending Coins</h2>
          </div>
          <Link to="/coins" className="text-blue-500 text-sm font-medium">See All</Link>
        </div>
        
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-orange-400 text-lg mr-2">🔥</span>
            <h2 className="text-gray-900 text-lg font-semibold">Trending Coins</h2>
          </div>
          <Link to="/coins" className="text-blue-500 text-sm font-medium">See All</Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600 text-sm">Unable to load live data. Showing cached results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-orange-400 text-lg mr-2">🔥</span>
          <h2 className="text-gray-900 text-lg font-semibold">Trending Coins</h2>
          <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <Link to="/coins" className="text-blue-500 text-sm font-medium">See All</Link>
      </div>
      
      <div className="space-y-3">
        {cryptoData.slice(0, 5).map((coin) => {
          const priceChange = coin.quote.USD.percent_change_24h;
          const isPositive = priceChange >= 0;
          
          return (
            <Link 
              key={coin.id} 
              to={`/coin/${coin.symbol.toLowerCase()}`} 
              className="block"
            >
              <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getCoinColor(coin.symbol)}`}>
                    <span className="font-bold">{getCoinIcon(coin.symbol)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{coin.name}</p>
                    <p className="text-sm text-gray-500">{coin.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatPrice(coin.quote.USD.price)}</p>
                  <div className="flex items-center justify-end">
                    <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(priceChange)}
                    </span>
                    <div className="ml-2">
                      {isPositive ? (
                        <TrendingUp size={16} className="text-green-500" />
                      ) : (
                        <TrendingDown size={16} className="text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingCoins;