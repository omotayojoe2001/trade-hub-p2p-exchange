import React, { useState } from 'react';
import { ArrowLeft, Crown, TrendingUp, TrendingDown, Star, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomNavigation from '@/components/BottomNavigation';

const TrendingCoins = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');

  const coins = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '$97,234.50',
      change24h: '+2.45%',
      changeType: 'positive',
      marketCap: '$1.9T',
      volume: '$45.2B',
      icon: '₿',
      rank: 1
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      price: '$3,456.78',
      change24h: '+1.23%',
      changeType: 'positive',
      marketCap: '$415.6B',
      volume: '$18.7B',
      icon: 'Ξ',
      rank: 2
    },
    {
      id: 'tether',
      name: 'Tether',
      symbol: 'USDT',
      price: '$1.00',
      change24h: '+0.01%',
      changeType: 'positive',
      marketCap: '$118.4B',
      volume: '$52.1B',
      icon: '₮',
      rank: 3
    },
    {
      id: 'bnb',
      name: 'BNB',
      symbol: 'BNB',
      price: '$692.45',
      change24h: '-0.87%',
      changeType: 'negative',
      marketCap: '$100.2B',
      volume: '$2.1B',
      icon: 'B',
      rank: 4
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      price: '$245.67',
      change24h: '+5.23%',
      changeType: 'positive',
      marketCap: '$115.8B',
      volume: '$4.2B',
      icon: '◎',
      rank: 5
    },
    {
      id: 'cardano',
      name: 'Cardano',
      symbol: 'ADA',
      price: '$1.23',
      change24h: '+3.45%',
      changeType: 'positive',
      marketCap: '$43.2B',
      volume: '$1.8B',
      icon: '₳',
      rank: 6
    },
    {
      id: 'xrp',
      name: 'XRP',
      symbol: 'XRP',
      price: '$2.34',
      change24h: '-1.23%',
      changeType: 'negative',
      marketCap: '$133.5B',
      volume: '$8.9B',
      icon: '◉',
      rank: 7
    },
    {
      id: 'dogecoin',
      name: 'Dogecoin',
      symbol: 'DOGE',
      price: '$0.42',
      change24h: '+8.76%',
      changeType: 'positive',
      marketCap: '$61.8B',
      volume: '$3.2B',
      icon: 'Ð',
      rank: 8
    }
  ];

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCoinClick = (coin: any) => {
    // Navigate to coin detail page
    navigate(`/coin-detail/${coin.id}`, { state: { coin } });
  };

  const handleTradeClick = (e: React.MouseEvent, coin: any) => {
    e.stopPropagation(); // Prevent coin click
    navigate(`/premium-trade?coin=${coin.symbol}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-dashboard" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp size={24} className="mr-2 text-green-600" />
                Trending Coins
              </h1>
              <p className="text-gray-600 text-sm">Live cryptocurrency prices and trends</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market_cap">Market Cap</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="change">24h Change</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Market Overview */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-3">Market Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$2.8T</div>
              <div className="text-sm text-gray-600">Total Market Cap</div>
              <div className="text-xs text-green-600 flex items-center justify-center mt-1">
                <ArrowUpRight size={12} className="mr-1" />
                +2.1%
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$156B</div>
              <div className="text-sm text-gray-600">24h Volume</div>
              <div className="text-xs text-green-600 flex items-center justify-center mt-1">
                <ArrowUpRight size={12} className="mr-1" />
                +5.3%
              </div>
            </div>
          </div>
        </Card>

        {/* Coins List */}
        <div className="space-y-3">
          {filteredCoins.map((coin) => (
            <Card
              key={coin.id}
              onClick={() => handleCoinClick(coin)}
              className="p-4 bg-white cursor-pointer hover:shadow-md transition-all border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">#{coin.rank}</span>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-700">{coin.icon}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{coin.name}</div>
                    <div className="text-sm text-gray-500">{coin.symbol}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{coin.price}</div>
                  <div className={`text-sm flex items-center justify-end ${
                    coin.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {coin.changeType === 'positive' ? 
                      <ArrowUpRight size={14} className="mr-1" /> : 
                      <ArrowDownRight size={14} className="mr-1" />
                    }
                    {coin.change24h}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">Market Cap</div>
                  <div className="text-sm font-medium text-gray-900">{coin.marketCap}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">24h Volume</div>
                  <div className="text-sm font-medium text-gray-900">{coin.volume}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={(e) => handleTradeClick(e, coin)}
                >
                  Trade
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCoins.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No coins found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default TrendingCoins;
