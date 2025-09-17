import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, TrendingUp, CheckCircle, Plus, ArrowUpRight, ArrowDownLeft, DollarSign, RefreshCw, Send, Settings, Wrench, Coins, Home, BarChart3, Newspaper, CreditCard, User, TrendingUpIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoData } from '@/hooks/useCryptoData';
import CryptoTicker from '@/components/CryptoTicker';
import BottomNavigation from '@/components/BottomNavigation';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { isQuickAuthActive } = useQuickAuth();
  const { cryptoData, loading: cryptoLoading } = useCryptoData(2);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(20);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedTab, setSelectedTab] = useState('All');

  const navigate = useNavigate();

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

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);

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

  const displayName = profile?.display_name ||
                     user?.user_metadata?.full_name ||
                     user?.email?.split('@')[0] ||
                     'AJ';

  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const profilePicture = profile?.profile_picture_url;

  // Real recent trades data
  const recentTradesData = [
    {
      id: 1,
      text: '0.5 BTC → ₦75,234,500',
      date: 'Dec 15, 2:34 PM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 2,
      text: '$1,200 USDT → ₦1,856,400',
      date: 'Dec 15, 1:22 PM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 3,
      text: '2.3 ETH → ₦12,345,670',
      date: 'Dec 15, 11:45 AM',
      status: 'In Progress',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white font-['Poppins'] max-w-md mx-auto">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-base font-semibold text-black">
            Good Morning, AJ
          </h1>
          <div className="flex items-center space-x-3">
            <Link to="/notifications" className="relative">
              <Bell size={20} className="text-gray-600" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Link>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              {profilePicture ? (
                <img src={profilePicture} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 font-medium text-sm">{userInitials}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20">
        {/* Credits Card */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-[#0052FF] to-[#006BFF] rounded-xl px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-white text-sm">Credits</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-white text-xl font-bold">250</div>
                <Link to="/credits-purchase" className="text-white/80 text-xs hover:text-white">
                  + Buy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/buy-sell" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <ArrowUpRight size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-sm">Buy Crypto</span>
              </div>
            </Link>
            
            <Link to="/sell-crypto" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <ArrowDownLeft size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-sm">Sell Crypto</span>
              </div>
            </Link>
            
            <Link to="/sell-for-cash" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-sm">Sell → USD Cash</span>
              </div>
            </Link>
            
            <Link to="/send-naira-get-usd" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Send size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-sm">Send NGN → USD Cash</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Markets Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-black mb-3">Markets</h2>
          
          {/* Crypto Ticker */}
          <div className="mb-3 -mx-4">
            <CryptoTicker />
          </div>
          
          {/* Rate Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-xs mb-1">USD → NGN Rate</div>
              <div className="text-black font-bold text-sm">₦1,547</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-xs mb-1">Total Traders</div>
              <div className="text-black font-bold text-sm">2,847</div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-black mb-3">Recent Trades</h2>
          
          <div className="space-y-3">
            {recentTradesData.map((trade) => (
              <div key={trade.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-black font-bold text-sm mb-1">{trade.text}</div>
                    <div className="text-gray-500 text-xs">{trade.date}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${trade.statusColor}`}>
                    {trade.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Banner */}
        <div className="mb-6">
          <Link to="/referrals" className="block">
            <div className="bg-[#0052FF] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-white font-medium text-sm">
                  Invite friends. Earn Credits + Rewards.
                </div>
                <Send size={20} className="text-white" />
              </div>
            </div>
          </Link>
        </div>

        {/* Platform Updates */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-black mb-3">Platform Updates</h2>
          
          {/* Tab Selector */}
          <div className="flex space-x-2 mb-4">
            {['All', 'Favorites', 'DeFi', 'NFT'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  selectedTab === tab
                    ? 'bg-[#0052FF] text-white'
                    : 'bg-[#F8F9FA] text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Update Cards */}
          <div className="space-y-3">
            <div className="bg-[#F8F9FA] rounded-xl p-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center mr-3 mt-0.5">
                  <Wrench size={12} className="text-gray-600" />
                </div>
                <div>
                  <div className="text-black font-medium text-sm mb-1">
                    Maintenance planned on Sept. 20.
                  </div>
                  <div className="text-gray-600 text-xs">
                    Some services may be briefly unavailable.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#F8F9FA] rounded-xl p-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center mr-3 mt-0.5">
                  <Coins size={12} className="text-gray-600" />
                </div>
                <div>
                  <div className="text-black font-medium text-sm mb-1">
                    New coin listed: TON.
                  </div>
                  <div className="text-gray-600 text-xs">
                    Spot and futures pairs now available.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default Index;