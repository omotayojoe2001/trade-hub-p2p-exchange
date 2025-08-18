
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Building2, Bell, Settings, TrendingUp, ChevronRight, Star, DollarSign, Zap, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from '@/components/BottomNavigation';
import UserTypeToggle from '@/components/UserTypeToggle';
import TrackingNotification from '@/components/TrackingNotification';
import TrendingCoins from '@/components/TrendingCoins';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { useCryptoData } from '@/hooks/useCryptoData';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { isQuickAuthActive } = useQuickAuth();
  const { cryptoData, loading: cryptoLoading, error: cryptoError } = useCryptoData(50);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Today');
  const [selectedCoinFilter, setSelectedCoinFilter] = useState('All');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && profile && !profile.profile_completed) {
      navigate('/profile-setup');
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const userType = profile?.user_type || 'customer';

  // Mock data that changes based on time filter
  const getStatsData = () => {
    switch (selectedTimeFilter) {
      case 'Today':
        return { traders: '3,247', rate: '₦1,650', volume: '₦5.2M' };
      case 'This Week':
        return { traders: '18,591', rate: '₦1,648', volume: '₦32.8M' };
      case 'This Month':
        return { traders: '67,423', rate: '₦1,652', volume: '₦156.3M' };
      default:
        return { traders: '3,247', rate: '₦1,650', volume: '₦5.2M' };
    }
  };

  const statsData = getStatsData();

  // Filter crypto data based on coin filter
  const getFilteredCryptoData = () => {
    if (!cryptoData) return [];
    
    switch (selectedCoinFilter) {
      case 'Favorites':
        return cryptoData.filter(coin => ['bitcoin', 'ethereum', 'tether'].includes(coin.id.toString()));
      case 'DeFi':
        return cryptoData.filter(coin => ['uniswap', 'aave', 'compound-governance-token'].includes(coin.id.toString()));
      case 'NFT':
        return cryptoData.filter(coin => ['enjincoin', 'the-sandbox', 'decentraland'].includes(coin.id.toString()));
      default:
        return cryptoData;
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">👤</span>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Good Morning</p>
            <h1 className="text-gray-900 text-lg font-medium">{displayName}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/notifications">
            <Bell size={24} className="text-gray-600" />
          </Link>
          <Link to="/settings">
            <Settings size={24} className="text-gray-600" />
          </Link>
        </div>
      </div>

      {/* User Type Toggle */}
      <UserTypeToggle className="mb-4" />

      {/* Active Trade Tracking */}
      <TrackingNotification />

      {/* Stats Card */}
      <Card className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center mb-2">
              <TrendingUp size={16} className="text-green-500 mr-2" />
              <span className="text-gray-500 text-sm">Total Traders</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statsData.traders}</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <DollarSign size={16} className="text-blue-500 mr-2" />
              <span className="text-gray-500 text-sm">USD to NGN Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statsData.rate}</p>
          </div>
        </div>
        
        {/* Time Filters - Interactive */}
        <div className="flex space-x-2">
          {['Today', 'This Week', 'This Month'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex-1 sm:flex-none transition-colors ${
                selectedTimeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-gray-900 text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link to="/buy-sell" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <ArrowUp size={24} className="text-green-500" />
            </div>
            <span className="text-gray-700 text-sm font-medium">Buy</span>
          </Link>
          <Link to="/buy-sell" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <ArrowDown size={24} className="text-red-500" />
            </div>
            <span className="text-gray-700 text-sm font-medium">Sell</span>
          </Link>
          <Link to="/trade-history" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Clock size={24} className="text-blue-500" />
            </div>
            <span className="text-gray-700 text-sm font-medium">History</span>
          </Link>
          <Link to="/merchant-list" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Building2 size={24} className="text-purple-500" />
            </div>
            <span className="text-gray-700 text-sm font-medium">Bank</span>
          </Link>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="mb-6">
        <h2 className="text-gray-900 text-lg font-semibold mb-4">Recent Trades</h2>
        <div className="space-y-3">
          <Link to="/trade-completed" className="block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-500 text-lg">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Trade #124 Completed</p>
                  <p className="text-sm text-gray-500">BTC/USD • $45,230</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">2m ago</span>
            </div>
          </Link>
          <Link to="/trade-details" className="block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <Clock size={16} className="text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Trade #123 Pending</p>
                  <p className="text-sm text-gray-500">ETH/USD • $3,120</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">5m ago</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Withdraw USD Banner */}
      <Card className="bg-brand p-4 rounded-xl mb-6 text-brand-foreground">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg mb-1">Withdraw USD in Cash</h3>
            <p className="text-sm text-brand-foreground/80">Now available for Premium users</p>
          </div>
          <div className="text-2xl">💵</div>
        </div>
        <Link to="/premium">
          <Button className="bg-white text-brand hover:bg-gray-100 mt-3 w/full font-medium">
            Upgrade to Premium
          </Button>
        </Link>
      </Card>

      {/* Platform Updates */}
      <Link to="/notifications" className="block">
        <div className="bg-white p-4 rounded-xl mb-6 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-500 text-lg">📢</span>
              </div>
              <span className="font-semibold text-gray-900">Platform Updates</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">Maintenance notices & news</p>
        </div>
      </Link>

      {/* Coin Filters - Interactive */}
      <div className="flex space-x-4 mb-4">
        {['All', 'Favorites', 'DeFi', 'NFT'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedCoinFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCoinFilter === filter
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Filtered Coins */}
      {cryptoLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coins...</p>
        </div>
      ) : cryptoError ? (
        <div className="text-center py-8">
          <p className="text-red-600">Error loading coins</p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="space-y-3">
            {getFilteredCryptoData().slice(0, 5).map((coin) => (
              <Link 
                key={coin.id} 
                to={`/coin/${coin.id}`} 
                className="block bg-white p-4 rounded-xl border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">{coin.symbol === 'BTC' ? '₿' : coin.symbol === 'ETH' ? '⧫' : '●'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{coin.name}</h3>
                      <p className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${coin.current_price.toLocaleString()}</p>
                    <p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* Refer & Earn and My Rewards - Stacked */}
      <div className="space-y-4 mb-6">
        <Link to="/referrals" className="block">
          <Card className="bg-brand p-4 rounded-xl text-brand-foreground hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Refer & Earn</h3>
              <span className="text-2xl">🎁</span>
            </div>
            <p className="text-sm text-brand-foreground/80">Earn points when you invite friends</p>
          </Card>
        </Link>
        
        <Card className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">My Rewards</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-2xl font-bold text-success">$2,450 USD</p>
        </Card>
      </div>

      {/* Unlock Premium Features */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Star size={20} className="text-yellow-400 mr-2" />
          <h2 className="text-gray-900 text-lg font-semibold">Unlock Premium Features</h2>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <DollarSign size={20} className="text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Withdraw USD</p>
                <p className="text-sm text-gray-500">Cash pickup available</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-lg">🔒</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Zap size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Priority Trading</p>
                <p className="text-sm text-gray-500">Faster processing</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-lg">🔒</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Features */}
      <div className="mb-6">
        <h2 className="text-gray-900 text-lg font-semibold mb-4">🎬 Demo Features</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/merchant-dashboard" className="bg-orange-100 p-3 rounded-lg">
            <div className="text-center">
              <span className="text-orange-600 text-lg">🏪</span>
              <p className="text-sm font-medium text-orange-700 mt-1">Merchant View</p>
            </div>
          </Link>
          <Link to="/notifications-demo" className="bg-blue-100 p-3 rounded-lg">
            <div className="text-center">
              <span className="text-blue-600 text-lg">🔔</span>
              <p className="text-sm font-medium text-blue-700 mt-1">Push Notifications</p>
            </div>
          </Link>
          <Link to="/premium-dashboard" className="bg-purple-100 p-3 rounded-lg">
            <div className="text-center">
              <span className="text-purple-600 text-lg">👑</span>
              <p className="text-sm font-medium text-purple-700 mt-1">Premium View</p>
            </div>
          </Link>
          <Link to="/buy-crypto-flow" className="bg-green-100 p-3 rounded-lg">
            <div className="text-center">
              <span className="text-green-600 text-lg">💱</span>
              <p className="text-sm font-medium text-green-700 mt-1">Buy Crypto</p>
            </div>
          </Link>
        </div>
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default Index;
