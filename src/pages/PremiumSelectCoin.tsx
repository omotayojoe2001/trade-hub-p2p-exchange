import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Users, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import CryptoIcon from '@/components/CryptoIcon';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumSelectCoin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode = 'buy' } = location.state || {};

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
    }
  ];

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCoinSelect = (coinId: string) => {
    const selectedCoinData = coins.find(c => c.id === coinId);
    navigate('/premium-merchant-matching-choice', {
      state: {
        selectedCoin: coinId,
        coinData: selectedCoinData,
        mode: mode,
        type: mode,
        coinType: selectedCoinData?.symbol || 'BTC'
      }
    });
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate('/premium-trade')} className="mr-4">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <div className="flex items-center">
              <Crown size={20} className="text-gray-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Premium Select Coin</h1>
            </div>
            <p className="text-sm text-gray-600">
              {mode === 'buy' 
                ? 'Select the coin you want to buy from verified sellers.' 
                : 'Select the coin & network to sell to thousands of users.'
              }
            </p>
          </div>
        </div>
        <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          <Crown size={12} className="mr-1" />
          Premium
        </div>
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
              <Card key={coin.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer">
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
                    <Crown size={16} className="text-gray-500 mr-2" />
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
                    <p className="text-gray-500 mb-1">Avg Rate:</p>
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
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={availableCount === 0}
                >
                  <Crown size={16} className="mr-2" />
                  {getActionText(coin)}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Premium Info */}
        <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 mt-1">
              <Crown size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Premium P2P Trading</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your premium payment is protected by advanced escrow. Priority matching with verified merchants and exclusive rates.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumSelectCoin;