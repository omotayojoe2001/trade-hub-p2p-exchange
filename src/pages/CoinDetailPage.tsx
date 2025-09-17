import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Crown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';

const CoinDetailPage = () => {
  const { coinId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isPremium = false; // Removed premium system
  
  // Get coin data from location state or use default
  const coinData = location.state?.coin || {
    id: coinId,
    name: 'Bitcoin',
    symbol: 'BTC',
    price: '$97,234.50',
    change24h: '+2.45%',
    changeType: 'positive',
    marketCap: '$1.9T',
    volume: '$45.2B',
    icon: '₿',
    rank: 1
  };

  const [timeframe, setTimeframe] = useState('24h');

  const stats = [
    { label: 'Market Cap', value: coinData.marketCap, change: '+2.1%' },
    { label: '24h Volume', value: coinData.volume, change: '+5.3%' },
    { label: 'Circulating Supply', value: '19.8M BTC', change: null },
    { label: 'Total Supply', value: '21M BTC', change: null }
  ];

  const priceHistory = [
    { time: '1h', change: '+0.5%', type: 'positive' },
    { time: '24h', change: '+2.45%', type: 'positive' },
    { time: '7d', change: '+8.2%', type: 'positive' },
    { time: '30d', change: '+15.7%', type: 'positive' },
    { time: '1y', change: '+125.4%', type: 'positive' }
  ];

  const handleTrade = (type: 'buy' | 'sell') => {
    if (isPremium) {
      navigate(`/premium-trade?coin=${coinData.symbol}&type=${type}`);
    } else {
      navigate(`/buy-sell?coin=${coinData.symbol}&type=${type}`);
    }
  };

  return (
    <div className={`min-h-screen ${isPremium ? 'bg-gray-50' : 'bg-white'} pb-20`}>
      {/* Header */}
      <div className={`${isPremium ? 'bg-white border-b border-gray-200' : 'bg-blue-600'} px-4 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isPremium ? "/trending-coins" : "/coins"} className="mr-4">
              <ArrowLeft size={24} className={isPremium ? 'text-gray-600' : 'text-white'} />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">{coinData.icon}</span>
              </div>
              <div>
                <h1 className={`text-xl font-semibold ${isPremium ? 'text-gray-900' : 'text-white'}`}>
                  {coinData.name}
                </h1>
                <p className={`text-sm ${isPremium ? 'text-gray-600' : 'text-blue-100'}`}>
                  {coinData.symbol} • Rank #{coinData.rank}
                </p>
              </div>
            </div>
          </div>
          {isPremium && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
              <Crown size={12} className="mr-1" />
              Premium
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price Section */}
        <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${isPremium ? 'text-gray-900' : 'text-gray-900'} mb-2`}>
              {coinData.price}
            </div>
            <div className={`flex items-center justify-center text-lg ${
              coinData.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {coinData.changeType === 'positive' ? 
                <ArrowUpRight size={20} className="mr-1" /> : 
                <ArrowDownRight size={20} className="mr-1" />
              }
              {coinData.change24h}
            </div>
          </div>

          {/* Price History */}
          <div className="grid grid-cols-5 gap-2">
            {priceHistory.map((period) => (
              <button
                key={period.time}
                onClick={() => setTimeframe(period.time)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  timeframe === period.time
                    ? isPremium
                      ? 'bg-gray-900 text-white'
                      : 'bg-blue-600 text-white'
                    : isPremium
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-xs font-medium">{period.time}</div>
                <div className={`text-xs ${
                  timeframe === period.time
                    ? 'text-white'
                    : period.type === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {period.change}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Market Stats */}
        <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
          <h3 className={`font-semibold ${isPremium ? 'text-gray-900' : 'text-gray-900'} mb-4`}>
            Market Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm ${isPremium ? 'text-gray-600' : 'text-gray-600'} mb-1`}>
                  {stat.label}
                </div>
                <div className={`font-semibold ${isPremium ? 'text-gray-900' : 'text-gray-900'}`}>
                  {stat.value}
                </div>
                {stat.change && (
                  <div className="text-xs text-green-600 mt-1">
                    {stat.change}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* About */}
        <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
          <h3 className={`font-semibold ${isPremium ? 'text-gray-900' : 'text-gray-900'} mb-3`}>
            About {coinData.name}
          </h3>
          <p className={`text-sm ${isPremium ? 'text-gray-600' : 'text-gray-600'} leading-relaxed`}>
            {coinData.name} ({coinData.symbol}) is a decentralized digital currency that enables instant payments to anyone, anywhere in the world. 
            It uses peer-to-peer technology to operate with no central authority: managing transactions and issuing money are carried out collectively by the network.
          </p>
        </Card>

        {/* Trading Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleTrade('buy')}
            className={`h-14 ${
              isPremium
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white font-semibold`}
          >
            <TrendingUp size={20} className="mr-2" />
            Buy {coinData.symbol}
          </Button>
          <Button
            onClick={() => handleTrade('sell')}
            className={`h-14 ${
              isPremium
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white font-semibold`}
          >
            <TrendingDown size={20} className="mr-2" />
            Sell {coinData.symbol}
          </Button>
        </div>

        {/* Premium Features */}
        {isPremium && (
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Crown size={20} className="mr-2 text-yellow-600" />
              Premium Trading Features
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></div>
                Priority matching for faster trades
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></div>
                Better exchange rates and lower fees
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></div>
                Advanced trading analytics
              </div>
            </div>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CoinDetailPage;
