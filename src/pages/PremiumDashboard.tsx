import React from 'react';
import { ArrowLeft, Crown, Zap, Shield, DollarSign, TrendingUp, Users, Clock, Gift, Truck, RefreshCw, Star, ArrowUpRight, ArrowDownRight, MessageCircle, Bell, FileText, Newspaper, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { useUserSetup } from '@/hooks/useUserSetup';

const PremiumDashboard = () => {
  const navigate = useNavigate();
  const { isSetupComplete, isSettingUp } = useUserSetup();

  const premiumFeatures = [
    {
      icon: <Zap size={20} className="text-yellow-500" />,
      title: 'Priority Matching',
      description: 'Get matched with merchants 3x faster',
      status: 'active'
    },
    {
      icon: <DollarSign size={20} className="text-green-500" />,
      title: 'Instant Withdrawals',
      description: 'Cash out to your bank instantly',
      status: 'active'
    },
    {
      icon: <Shield size={20} className="text-blue-500" />,
      title: 'Premium Support',
      description: '24/7 dedicated customer support',
      status: 'active'
    },
    {
      icon: <TrendingUp size={20} className="text-purple-500" />,
      title: 'Advanced Analytics',
      description: 'Detailed trading insights and reports',
      status: 'active'
    }
  ];

  const premiumStats = {
    tradesSaved: '₦125,000',
    fastMatches: 47,
    supportResponse: '< 1 min',
    premiumSince: 'Dec 2024'
  };

  const trendingCoins = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '$97,234.50',
      change: '+2.45%',
      changeType: 'positive',
      icon: '₿'
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      price: '$3,456.78',
      change: '+1.23%',
      changeType: 'positive',
      icon: 'Ξ'
    },
    {
      name: 'USDT',
      symbol: 'USDT',
      price: '$1.00',
      change: '+0.01%',
      changeType: 'positive',
      icon: '₮'
    },
    {
      name: 'BNB',
      symbol: 'BNB',
      price: '$692.45',
      change: '-0.87%',
      changeType: 'negative',
      icon: 'B'
    }
  ];

  const coreFeatures = [
    {
      icon: <TrendingUp size={20} className="text-green-600" />,
      title: 'Buy/Sell Crypto',
      description: 'Trade crypto with premium benefits',
      action: () => navigate('/premium-trade'),
      premium: false
    },
    {
      icon: <MessageCircle size={20} className="text-blue-600" />,
      title: 'Messages',
      description: 'Secure premium messaging',
      action: () => navigate('/premium-messages'),
      premium: false
    },
    {
      icon: <FileText size={20} className="text-purple-600" />,
      title: 'Trade Requests',
      description: 'Manage your trade requests',
      action: () => navigate('/premium-trade-requests'),
      premium: false
    },
    {
      icon: <Newspaper size={20} className="text-indigo-600" />,
      title: 'Crypto News',
      description: 'Latest crypto market news',
      action: () => navigate('/premium-news'),
      premium: false
    }
  ];

  const premiumQuickActions = [
    {
      icon: <Truck size={20} className="text-yellow-600" />,
      title: 'Cash Delivery',
      description: 'Get cash delivered to your doorstep',
      action: () => navigate('/premium-trade'),
      premium: true
    },
    {
      icon: <RefreshCw size={20} className="text-green-600" />,
      title: 'Send Naira, Get USD',
      description: 'Send Naira and receive USD instantly',
      action: () => navigate('/send-naira-get-usd'),
      premium: true
    },

    {
      icon: <DollarSign size={20} className="text-blue-600" />,
      title: 'Sell for Cash',
      description: 'Sell crypto for instant cash',
      action: () => navigate('/sell-for-cash'),
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <Crown size={20} className="text-yellow-500" />
            <h1 className="text-lg font-semibold text-gray-900">Premium Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-brand text-brand-foreground px-3 py-1 rounded-full">
          <Crown size={14} />
          <span className="text-sm font-medium">Premium Active</span>
        </div>
      </div>

      <div className="p-4">
        {/* Welcome Banner */}
        <Card className="p-6 mb-6 bg-brand text-brand-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Premium!</h2>
              <p className="text-purple-100">
                You're now enjoying exclusive features and priority service.
              </p>
            </div>
            <Crown size={48} className="text-yellow-300" />
          </div>
        </Card>

        {/* Premium Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fees Saved</p>
                <p className="text-2xl font-bold text-green-600">{premiumStats.tradesSaved}</p>
              </div>
              <DollarSign size={24} className="text-green-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fast Matches</p>
                <p className="text-2xl font-bold text-blue-600">{premiumStats.fastMatches}</p>
              </div>
              <Zap size={24} className="text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Support Response</p>
                <p className="text-2xl font-bold text-purple-600">{premiumStats.supportResponse}</p>
              </div>
              <Clock size={24} className="text-purple-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-2xl font-bold text-gray-900">{premiumStats.premiumSince}</p>
              </div>
              <Users size={24} className="text-gray-500" />
            </div>
          </Card>
        </div>

        {/* Trending Coins Section */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <TrendingUp size={20} className="text-yellow-600 mr-2" />
              Trending Coins
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/trending-coins')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {trendingCoins.map((coin, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-yellow-600 font-bold text-sm">{coin.icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{coin.name}</div>
                    <div className="text-xs text-gray-500">{coin.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm text-gray-900">{coin.price}</div>
                  <div className={`text-xs flex items-center ${
                    coin.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {coin.changeType === 'positive' ?
                      <ArrowUpRight size={12} className="mr-1" /> :
                      <ArrowDownRight size={12} className="mr-1" />
                    }
                    {coin.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Core Features */}
        <Card className="p-4 mb-6 bg-white border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Star size={20} className="text-gray-600 mr-2" />
            Core Features (Premium Enhanced)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {coreFeatures.map((feature, index) => (
              <button
                key={index}
                onClick={feature.action}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="flex items-center mb-2">
                  {feature.icon}
                  <Crown size={12} className="text-yellow-500 ml-auto" />
                </div>
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Premium Quick Actions */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Crown size={20} className="text-purple-600 mr-2" />
            Premium Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {premiumQuickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors text-left"
              >
                <div className="flex items-center mb-2">
                  {action.icon}
                  <Crown size={12} className="text-yellow-500 ml-auto" />
                </div>
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-600">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Refer and Earn Section */}
        <Card className="p-4 mb-6 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Gift size={20} className="text-gray-600 mr-2" />
              Refer & Earn Premium
            </h3>
            <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
              <Crown size={10} className="mr-1" />
              Premium
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">2%</div>
              <div className="text-sm text-gray-600">Lifetime earnings from every successful trade</div>
              <div className="text-xs text-gray-500 mt-1">Your referrals make</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">12</div>
                <div className="text-xs text-gray-500">Referred</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">8</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">₦127,500</div>
                <div className="text-xs text-gray-500">Lifetime Earned</div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/premium-referral')}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Users size={16} className="mr-2" />
              Start Referring
            </Button>
          </div>
        </Card>

        {/* Premium Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Premium Features</h3>
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>



        {/* Subscription Info */}
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Subscription Details</h4>
            <Crown size={20} className="text-yellow-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">Premium Annual</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next billing:</span>
              <span className="font-medium">Dec 15, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Manage Subscription
          </Button>
        </Card>
      </div>
      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumDashboard;