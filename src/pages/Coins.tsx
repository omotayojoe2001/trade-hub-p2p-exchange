import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, ChevronDown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCryptoData } from '@/hooks/useCryptoData';

const Coins = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { cryptoData, loading, error, favorites, toggleFavorite } = useCryptoData(100);

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
      btc: '₿', eth: 'Ξ', usdt: '₮', bnb: 'B', doge: 'D',
      ada: '₳', sol: 'S', xrp: 'X', dot: '●', avax: 'A',
    };
    return iconMap[symbol.toLowerCase()] || symbol.charAt(0).toUpperCase();
  };

  const getCoinColor = (symbol: string) => {
    const colorMap: { [key: string]: string } = {
      btc: 'text-orange-500 bg-orange-100',
      eth: 'text-blue-500 bg-blue-100',
      usdt: 'text-green-500 bg-green-100',
      bnb: 'text-yellow-500 bg-yellow-100',
      doge: 'text-purple-500 bg-purple-100',
      ada: 'text-indigo-500 bg-indigo-100',
      sol: 'text-pink-500 bg-pink-100',
      xrp: 'text-gray-500 bg-gray-100',
      dot: 'text-red-500 bg-red-100',
      avax: 'text-cyan-500 bg-cyan-100',
    };
    return colorMap[symbol.toLowerCase()] || 'text-gray-500 bg-gray-100';
  };

  const getCoinTag = (coin: any) => {
    if (coin.market_cap_rank <= 10) return { text: 'Top 10', color: 'bg-green-500' };
    if (coin.price_change_percentage_24h > 10) return { text: 'Hot', color: 'bg-red-500' };
    if (coin.price_change_percentage_24h > 5) return { text: 'Trending', color: 'bg-orange-500' };
    if (Math.abs(coin.price_change_percentage_24h) < 1) return { text: 'Stable', color: 'bg-blue-500' };
    return null;
  };

  const defiCoins = ['ethereum', 'binancecoin', 'cardano', 'solana', 'avalanche-2', 'polygon', 'chainlink'];
  const nftCoins = ['ethereum', 'solana', 'polygon', 'flow', 'wax'];

  const filteredCoins = useMemo(() => {
    let filtered = cryptoData;

    // Apply category filter
    if (activeFilter === 'favorites') {
      filtered = filtered.filter(coin => favorites.includes(coin.symbol.toLowerCase()));
    } else if (activeFilter === 'defi') {
      filtered = filtered.filter(coin => defiCoins.includes(coin.symbol.toLowerCase()));
    } else if (activeFilter === 'nft') {
      filtered = filtered.filter(coin => nftCoins.includes(coin.symbol.toLowerCase()));
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(coin =>
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [cryptoData, activeFilter, favorites, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp size={24} className="text-orange-500 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">All Coins</h1>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border-b border-gray-100">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp size={24} className="text-orange-500 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">All Coins</h1>
            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <button className="p-2">
            <ChevronDown size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-4 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'defi', label: 'DeFi' },
            { id: 'nft', label: 'NFT' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
              {filter.id === 'favorites' && favorites.length > 0 && (
                <span className="ml-1 text-xs">({favorites.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 bg-gray-50 border-0 rounded-xl pl-12 pr-12 text-gray-900 placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <span className="text-gray-400 text-lg">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Coin List */}
      <div className="px-4">
        <div className="bg-white rounded-lg">
          {filteredCoins.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {activeFilter === 'favorites' ? 'No favorite coins yet' : 'No coins found'}
              </p>
            </div>
          ) : (
            filteredCoins.map((coin, index) => {
              const tag = getCoinTag(coin);
              const isPositive = coin.price_change_percentage_24h >= 0;
              const isFavorite = favorites.includes(coin.symbol.toLowerCase());
              
              return (
                <div
                  key={coin.symbol}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    index !== filteredCoins.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Link 
                    to={`/coin/${coin.symbol.toLowerCase()}`}
                    className="flex items-center flex-1"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getCoinColor(coin.symbol)}`}>
                      <span className="text-lg font-bold">
                        {getCoinIcon(coin.symbol)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-gray-900">{coin.name}</p>
                        {tag && (
                          <span className={`${tag.color} text-white text-xs font-medium px-2 py-1 rounded`}>
                            {tag.text}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</p>
                    </div>
                  </Link>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 mb-1">
                        {formatPrice(coin.current_price)}
                      </p>
                      <p className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(coin.symbol.toLowerCase());
                      }}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <Star
                        size={16}
                        className={isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {filteredCoins.length > 0 && cryptoData.length >= 50 && (
          <div className="text-center mt-8 mb-6">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium"
            >
              ↓ Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coins;