import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Zap, Shield, DollarSign, TrendingUp, Users, Clock, Gift, Truck, RefreshCw, Star, ArrowUpRight, ArrowDownRight, MessageCircle, Bell, FileText, Newspaper, Settings, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { creditsService } from '@/services/creditsService';
import { supabase } from '@/integrations/supabase/client';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { useUserSetup } from '@/hooks/useUserSetup';
import { Switch } from "@headlessui/react";
import { PREMIUM_CONFIG } from '@/constants/premium';
import { cryptoService, CoinPrice } from '@/services/cryptoService';

const PremiumDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSetupComplete, isSettingUp } = useUserSetup();
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [trendingCoins, setTrendingCoins] = useState<CoinPrice[]>([]);

  useEffect(() => {
    loadCreditsBalance();
    loadProfile();
    loadTrendingCoins();
  }, [user]);

  const loadCreditsBalance = async () => {
    if (!user?.id) return;
    try {
      const balance = await creditsService.getCreditBalance(user.id);
      setCreditsBalance(balance);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const premiumFeatures = [
    {
      icon: <Zap size={20} className="text-gray-600" />,
      title: 'Priority Matching',
      description: 'Get matched with merchants 3x faster',
      status: 'active'
    },
    {
      icon: <DollarSign size={20} className="text-gray-600" />,
      title: 'Instant Withdrawals',
      description: 'Cash out to your bank instantly',
      status: 'active'
    },
    {
      icon: <Shield size={20} className="text-gray-600" />,
      title: 'Premium Support',
      description: '24/7 dedicated customer support',
      status: 'active'
    },
    {
      icon: <TrendingUp size={20} className="text-gray-600" />,
      title: 'Advanced Analytics',
      description: 'Detailed trading insights and reports',
      status: 'active'
    }
  ];

  // Remove mock stats - will load real data from database
  const [premiumStats, setPremiumStats] = useState({
    tradesSaved: '₦0',
    fastMatches: 0,
    supportResponse: 'N/A',
    premiumSince: 'Recently'
  });

  const loadTrendingCoins = async () => {
    try {
      const coins = await cryptoService.getTrendingCoins();
      setTrendingCoins(coins);
    } catch (error) {
      console.error('Error loading trending coins:', error);
    }
  };

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
              <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.display_name || user?.email?.split('@')[0] || 'Premium User'}!</h2>
              <p className="text-purple-100">
                You're enjoying exclusive premium features and priority service.
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
                <p className="text-sm text-gray-600">Credits Balance</p>
                <p className="text-2xl font-bold text-yellow-600">{creditsBalance}</p>
              </div>
              <CreditCard size={24} className="text-yellow-500" />
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
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : 'Recently'
                  }
                </p>
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
              <div className="text-2xl font-bold text-gray-900 mb-1">{PREMIUM_CONFIG.REFERRAL_PERCENTAGE}%</div>
              <div className="text-sm text-gray-600">Lifetime earnings from every successful trade</div>
              <div className="text-xs text-gray-500 mt-1">Your referrals make</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">{profile?.referrals_count || 0}</div>
                <div className="text-xs text-gray-500">Referred</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{profile?.active_referrals || 0}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">₦{(profile?.referral_earnings || 0).toLocaleString()}</div>
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
              <span className="font-medium">
                {profile?.premium_expires_at 
                  ? new Date(profile.premium_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A'
                }
              </span>
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