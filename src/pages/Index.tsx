
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Building2, Bell, TrendingUp, ChevronRight, Star, DollarSign, Zap, CreditCard, User, Gift, Trophy, Lock, Megaphone, CheckCircle, Truck, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from '@/components/BottomNavigation';
import { useUserSetup } from '@/hooks/useUserSetup';
import UserTypeToggle from '@/components/UserTypeToggle';
import TrackingNotification from '@/components/TrackingNotification';
import TrendingCoins from '@/components/TrendingCoins';
import CryptoIcon from '@/components/CryptoIcon';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePremium } from '@/hooks/usePremium';
import TradeTimeDisplay from '@/components/TradeTimeDisplay';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { isQuickAuthActive } = useQuickAuth();
  const { isPremium } = usePremium();
  const { cryptoData, loading: cryptoLoading, error: cryptoError } = useCryptoData(50);
  const { isSetupComplete, isSettingUp } = useUserSetup();
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Today');
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const { toast } = useToast();
  const [selectedCoinFilter, setSelectedCoinFilter] = useState('All');
  const [totalUsers, setTotalUsers] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const navigate = useNavigate();

  // Fetch actual user count
  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setTotalUsers(count);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  };

  // Fetch unread notifications
  const fetchUnreadNotifications = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch recent trades
  const fetchRecentTrades = async () => {
    if (!user) return;

    try {
      setLoadingTrades(true);

      // Fetch only user's own trades - SECURITY FIX
      const { data: tradesData, error } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recent trades:', error);
        return;
      }

      // Fetch only user's own trade requests - SECURITY FIX
      const { data: requestsData, error: requestsError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'accepted', 'pending'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (requestsError) {
        console.error('Error fetching trade requests:', requestsError);
      }

      // Format user's own trades only
      const formattedTrades = (tradesData || []).map(trade => ({
        id: trade.id,
        type: trade.trade_type || 'buy', // Use trade_type from database
        coin: trade.coin_type || 'BTC',
        amount: trade.amount || 0,
        nairaAmount: trade.naira_amount || 0,
        status: trade.status,
        merchant: trade.buyer_id === user.id ? 'Selling to' : 'Buying from', // Show relationship to user
        date: new Date(trade.created_at),
        isTradeRequest: false
      }));

      // Format user's own trade requests only
      const formattedRequests = (requestsData || []).map(request => ({
        id: request.id,
        type: request.trade_type,
        coin: request.crypto_type || 'BTC',
        amount: request.amount_crypto || 0,
        nairaAmount: request.amount_fiat || 0,
        status: request.status === 'open' ? 'pending' : request.status,
        merchant: 'Your Request',
        date: new Date(request.created_at),
        isTradeRequest: true
      }));

      // Combine and sort by date
      const allTrades = [...formattedTrades, ...formattedRequests]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3);

      setRecentTrades(allTrades);

    } catch (error) {
      console.error('Error in fetchRecentTrades:', error);
    } finally {
      setLoadingTrades(false);
    }
  };

  useEffect(() => {
    fetchUserCount();
    if (user) {
      fetchRecentTrades();
      fetchUnreadNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && profile && !profile.profile_completed) {
      navigate('/profile-setup');
    }
    // Removed premium redirect - let users stay on home page
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

  // Get display name from current user's profile only
  const displayName = profile?.display_name ||
                     user?.user_metadata?.full_name ||
                     user?.email?.split('@')[0] ||
                     'User';
  const userType = profile?.user_type || 'customer';

  // Get user's own profile picture or use initials
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const profilePicture = profile?.profile_picture_url;

  // Real data that shows actual user count
  const getStatsData = () => {
    return { 
      traders: totalUsers.toLocaleString(), 
      rate: '₦1,650', 
      volume: '₦5.2M' 
    };
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
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const currentTarget = e.currentTarget as HTMLImageElement;
                  const nextSibling = currentTarget.nextElementSibling as HTMLElement;
                  currentTarget.style.display = 'none';
                  if (nextSibling) {
                    nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center text-blue-600 font-medium ${profilePicture ? 'hidden' : 'flex'}`}
            >
              {userInitials}
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Good Morning</p>
            <h1 className="text-gray-900 dark:text-white text-lg font-medium">{displayName}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/notifications" className="relative">
            <Bell size={24} className="text-gray-600 dark:text-gray-400" />
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </Link>
          <ThemeToggle />
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
          <Link to="/my-trades" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Clock size={24} className="text-blue-500" />
            </div>
            <span className="text-gray-700 text-sm font-medium">History</span>
          </Link>
          <Link to="/payment-methods" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Building2 size={24} className="text-purple-500" />
            </div>
            <span className="text-gray-700 text-sm font-medium">Bank</span>
          </Link>
        </div>
      </div>

      {/* Recent Trades - Real Data */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 text-lg font-semibold">Recent Trades</h2>
          <Link to="/my-trades" className="text-blue-600 text-sm font-medium hover:text-blue-700">
            See All
          </Link>
        </div>

        {loadingTrades ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading trades...</p>
          </div>
        ) : recentTrades.length > 0 ? (
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div 
                key={trade.id} 
                onClick={() => {
                  if (trade.isTradeRequest || trade.status === 'pending') {
                    console.log('Trade not found or still pending');
                    toast({
                      title: "Trade Not Found",
                      description: "This trade is not available for viewing.",
                      variant: "destructive"
                    });
                  } else {
                    navigate(`/trade-details/${trade.id}`);
                  }
                }}
                className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    trade.status === 'completed'
                      ? 'bg-green-100'
                      : trade.status === 'cancelled'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                  }`}>
                    {trade.status === 'completed' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Clock size={16} className={trade.status === 'cancelled' ? 'text-red-500' : 'text-yellow-500'} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {trade.type === 'buy' ? 'Purchase' : 'Sale'}: {trade.amount} {trade.coin}
                    </p>
                    <p className="text-sm text-gray-500">
                      {trade.status === 'completed' ? 'Completed' :
                       trade.status === 'cancelled' ? 'Cancelled' :
                       trade.status === 'failed' ? 'Failed' : 'In Progress'} • ₦{(trade.nairaAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <TradeTimeDisplay date={trade.date} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No recent trades</p>
            <Link to="/buy-sell" className="text-blue-600 text-sm font-medium hover:text-blue-700">
              Start Trading
            </Link>
          </div>
        )}
      </div>

      {/* Withdraw USD Banner */}
      <Card className="bg-brand p-4 rounded-xl mb-6 text-brand-foreground">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg mb-1">Withdraw USD in Cash</h3>
            <p className="text-sm text-brand-foreground/80">Now available for Premium users</p>
          </div>
          <div className="text-2xl">
            <DollarSign size={24} className="text-brand-foreground" />
          </div>
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
                <Megaphone size={16} className="text-blue-500" />
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
                       <CryptoIcon symbol={coin.symbol} size={24} />
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
              <Gift size={24} className="text-brand-foreground" />
            </div>
            <p className="text-sm text-brand-foreground/80">Earn points when you invite friends</p>
          </Card>
        </Link>
        
        <Card className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">My Rewards</h3>
            <Trophy size={24} className="text-yellow-500" />
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
          <Link to="/premium" className="block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
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
                <Lock size={16} className="text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/premium" className="block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Truck size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Get Cash delivered to your doorstep</p>
                  <p className="text-sm text-gray-500">Home delivery service</p>
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Lock size={16} className="text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/premium" className="block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <RefreshCw size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Convert your local currency to cash</p>
                  <p className="text-sm text-gray-500">Instant currency conversion</p>
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Lock size={16} className="text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/premium" className="block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow">
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
                <Lock size={16} className="text-gray-400" />
              </div>
            </div>
          </Link>
        </div>
      </div>



      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default Index;
