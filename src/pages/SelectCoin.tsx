import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SelectCoin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const navigate = useNavigate();

  const coins = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: '₿',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      network: 'Native',
      sellers: 32,
      avgRate: '₦1,755,000/BTC',
      speed: '~3 mins',
      demand: 'High',
      demandColor: 'text-green-500'
    },
    {
      id: 'tether',
      name: 'Tether',
      symbol: 'USDT',
      icon: '₮',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      networks: ['TRC20', 'ERC20', 'BEP20'],
      sellers: 21,
      avgRate: '₦1,350/USD',
      speed: '~1 min',
      demand: 'High',
      demandColor: 'text-green-500'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: '♦',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      network: 'ERC20',
      sellers: 15,
      avgRate: '₦5,850,000/ETH',
      speed: '~5 mins',
      demand: 'Medium',
      demandColor: 'text-yellow-500'
    },
    {
      id: 'bnb',
      name: 'Binance Coin',
      symbol: 'BNB',
      icon: 'BNB',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      network: 'BEP20',
      sellers: 7,
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
    navigate('/merchant-selection');
  };

  const handleAutoMatch = () => {
    navigate('/sell-crypto');
  };

  const handleBrowseSellers = () => {
    navigate('/merchant-list');
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
            <p className="text-sm text-gray-500">Select the coin & network to sell to thousands of users.</p>
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
          {filteredCoins.map((coin) => (
            <Card key={coin.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${coin.iconBg} rounded-full flex items-center justify-center mr-3`}>
                    <span className={`${coin.iconColor} font-bold text-lg`}>{coin.icon}</span>
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
                  <p className="font-medium text-gray-900">
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
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Sellers:</p>
                  <p className="font-medium text-gray-900">{coin.sellers} Available</p>
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
                  coin.sellers > 0 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={coin.sellers === 0}
              >
                {coin.sellers > 0 ? `Select ${coin.name}` : 'Limited Availability'}
              </Button>
            </Card>
          ))}
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
            <span className="mr-2">🤖</span>
            Auto Match
          </Button>
          <Button 
            onClick={handleBrowseSellers}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Users size={16} className="mr-2" />
            Browse Sellers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectCoin;
