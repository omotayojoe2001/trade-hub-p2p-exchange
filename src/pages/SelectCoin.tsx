import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Users } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CryptoIcon from '@/components/CryptoIcon';

const SelectCoin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode = 'sell' } = location.state || {}; // Default to sell mode

  const coins = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: 'btc',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      network: 'Native',
      sellers: 32,
      buyers: 45,
      avgRate: '₦1,755,000/BTC',
      speed: '~3 mins',
      demand: 'High',
      demandColor: 'text-green-500'
    },
    {
      id: 'tether',
      name: 'Tether',
      symbol: 'USDT',
      icon: 'usdt',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      networks: ['TRC20', 'ERC20', 'BEP20'],
      sellers: 21,
      buyers: 38,
      avgRate: '₦1,350/USD',
      speed: '~1 min',
      demand: 'High',
      demandColor: 'text-green-500'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'eth',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      network: 'ERC20',
      sellers: 15,
      buyers: 22,
      avgRate: '₦5,850,000/ETH',
      speed: '~5 mins',
      demand: 'Medium',
      demandColor: 'text-yellow-500'
    },
    {
      id: 'bnb',
      name: 'Binance Coin',
      symbol: 'BNB',
      icon: 'bnb',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      network: 'BEP20',
      sellers: 7,
      buyers: 12,
      avgRate: '₦850,000/BNB',
      speed: '~2 mins',
      demand: 'Low',
      demandColor: 'text-red-500'
    }
  ];

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCoinSelect = (coinId: string) => {
    setSelectedCoin(coinId);
    // Route to merchant matching choice (auto vs manual)
    navigate('/merchant-matching-choice', {
      state: {
        selectedCoin: coinId,
        coinData: coins.find(c => c.id === coinId),
        mode: mode,
        type: mode,
        coinType: coins.find(c => c.id === coinId)?.symbol || 'BTC'
      }
    });
  };

  const handleAutoMatch = () => {
    // Auto match goes directly to auto-matching
    navigate('/auto-merchant-match', {
      state: {
        mode: mode,
        type: mode,
        coinType: 'BTC', // Default for auto-match
        autoMatch: true
      }
    });
  };

  const handleBrowseSellers = () => {
    if (mode === 'buy') {
      navigate('/merchant-list', { state: { type: 'buy' } });
    } else {
      navigate('/merchant-list', { state: { type: 'sell' } });
    }
  };

  const getAvailableCount = (coin: any) => {
    return mode === 'buy' ? coin.buyers : coin.sellers;
  };

  const getActionText = (coin: any) => {
    const count = getAvailableCount(coin);
    if (mode === 'buy') {
      return count > 0 ? `Buy ${coin.name}` : 'No Sellers Available';
    } else {
      return count > 0 ? `Sell ${coin.name}` : 'No Buyers Available';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/buy-sell" className="mr-4">
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Select Coin</h1>
            <p className="text-sm text-gray-500">
              {mode === 'buy' 
                ? 'Select the coin you want to buy from verified sellers.' 
                : 'Select the coin & network to sell to thousands of users.'
              }
            </p>
          </div>
        </div>
        <button className="text-gray-400">
          <span className="text-lg">⋮</span>
        </button>
      </div>

      <div className="p-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 bg-gray-50 border-gray-200 rounded-lg"
          />
        </div>

        {/* Coins List */}
        <div className="space-y-4 mb-6">
          {filteredCoins.map((coin) => {
            const availableCount = getAvailableCount(coin);
            return (
              <Card key={coin.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${coin.iconBg} rounded-full flex items-center justify-center mr-3`}>
                      <CryptoIcon symbol={coin.symbol || 'BTC'} size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{coin.name}</h3>
                      <p className="text-sm text-gray-500">{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      coin.demand === 'High' ? 'bg-green-500' : 
                      coin.demand === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></span>
                    <span className={`text-sm font-medium ${coin.demandColor}`}>{coin.demand}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Network:</p>
                    <div className="font-medium text-gray-900">
                      {coin.networks ? (
                        <div className="flex flex-wrap gap-1">
                          {coin.networks.map((network, index) => (
                            <span key={index} className={`px-2 py-1 rounded text-xs ${
                              network === 'TRC20' ? 'bg-blue-100 text-blue-600' :
                              network === 'ERC20' ? 'bg-red-100 text-red-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {network}
                            </span>
                          ))}
                        </div>
                      ) : coin.network}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{mode === 'buy' ? 'Sellers:' : 'Buyers:'}</p>
                    <p className="font-medium text-gray-900">{availableCount} Available</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">{coin.networks ? 'From:' : 'Avg Rate:'}</p>
                    <p className="font-medium text-gray-900">{coin.avgRate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Speed:</p>
                    <p className="font-medium text-gray-900">{coin.speed}</p>
                  </div>
                </div>

                <Button 
                  onClick={() => handleCoinSelect(coin.id)}
                  className={`w-full h-10 rounded-lg font-semibold ${
                    availableCount > 0 
                      ? mode === 'buy' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={availableCount === 0}
                >
                  {getActionText(coin)}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* P2P Trading Info */}
        <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 mt-1">
              <span className="text-white text-sm">🛡</span>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Secure P2P Trading</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your payment is protected by escrow. Cryptocurrency is only released after both parties confirm the transaction is complete.
              </p>
            </div>
          </div>
        </Card>

        {/* Bottom Actions */}
        <div className="flex space-x-4">
          <Button 
            onClick={handleAutoMatch}
            className="flex-1 h-12 bg-gray-800 text-white hover:bg-gray-900"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Auto Match
          </Button>
          <Button 
            onClick={handleBrowseSellers}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Users size={16} className="mr-2" />
            {mode === 'buy' ? 'Browse Sellers' : 'Browse Buyers'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectCoin;
