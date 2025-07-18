
import React, { useState } from 'react';
import { Search, TrendingUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Coins = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const coins = [
    { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      price: '$68,523', 
      change: '+2.4%', 
      changeColor: 'text-green-500',
      tag: 'Top Gainer', 
      tagColor: 'bg-green-500', 
      icon: '₿',
      iconBg: 'bg-orange-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      price: '$3,420', 
      change: '↓1.3%', 
      changeColor: 'text-red-500',
      tag: null, 
      tagColor: '', 
      icon: '♦',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Tether', 
      symbol: 'USDT', 
      price: '$1.00', 
      change: '📈0.0%', 
      changeColor: 'text-gray-500',
      tag: 'Stablecoin', 
      tagColor: 'bg-blue-500', 
      icon: 'T',
      iconBg: 'bg-green-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Solana', 
      symbol: 'SOL', 
      price: '$125.30', 
      change: '↓4.7%', 
      changeColor: 'text-red-500',
      tag: null, 
      tagColor: '', 
      icon: 'S',
      iconBg: 'bg-purple-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Cardano', 
      symbol: 'ADA', 
      price: '$0.40', 
      change: '↓0.9%', 
      changeColor: 'text-red-500',
      tag: null, 
      tagColor: '', 
      icon: 'A',
      iconBg: 'bg-blue-600',
      iconColor: 'text-white'
    },
    { 
      name: 'BNB', 
      symbol: 'BNB', 
      price: '$312.45', 
      change: '↑3.2%', 
      changeColor: 'text-green-500',
      tag: 'New', 
      tagColor: 'bg-red-500', 
      icon: 'B',
      iconBg: 'bg-yellow-500',
      iconColor: 'text-white'
    },
    { 
      name: 'XRP', 
      symbol: 'XRP', 
      price: '$0.52', 
      change: '↓2.1%', 
      changeColor: 'text-red-500',
      tag: null, 
      tagColor: '', 
      icon: 'X',
      iconBg: 'bg-gray-800',
      iconColor: 'text-white'
    },
    { 
      name: 'Dogecoin', 
      symbol: 'DOGE', 
      price: '$0.08', 
      change: '↑1.8%', 
      changeColor: 'text-green-500',
      tag: null, 
      tagColor: '', 
      icon: 'D',
      iconBg: 'bg-yellow-400',
      iconColor: 'text-white'
    }
  ];

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp size={24} className="text-orange-500 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">Trending Coins</h1>
          </div>
          <button className="p-2">
            <ChevronDown size={20} className="text-gray-600" />
          </button>
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
          {filteredCoins.map((coin, index) => (
            <Link 
              key={coin.symbol}
              to={`/coin/${coin.name.toLowerCase()}`}
              className={`block p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                index !== filteredCoins.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 ${coin.iconBg} rounded-full flex items-center justify-center mr-3`}>
                  <span className={`text-lg font-bold ${coin.iconColor}`}>
                    {coin.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-gray-900">{coin.name}</p>
                    {coin.tag && (
                      <span
                        className={`${coin.tagColor} text-white text-xs font-medium px-2 py-1 rounded`}
                      >
                        {coin.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{coin.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 mb-1">{coin.price}</p>
                <p className={`text-sm font-medium ${coin.changeColor}`}>
                  {coin.change}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8 mb-6">
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium"
          >
            ↓ Load More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Coins;
