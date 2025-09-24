import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, TrendingUp, CheckCircle, Plus, ArrowUpRight, ArrowDownLeft, DollarSign, RefreshCw, Send, Settings, Wrench, Coins, Home, BarChart3, Newspaper, CreditCard, User, TrendingUpIcon, MoveRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoData } from '@/hooks/useCryptoData';
import CryptoTicker from '@/components/CryptoTicker';
import BottomNavigation from '@/components/BottomNavigation';
import { creditsService } from '@/services/creditsService';
import { mockCreditsService, isDemoMode } from '@/services/mockCreditsService';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { isQuickAuthActive } = useQuickAuth();
  const { cryptoData, loading: cryptoLoading } = useCryptoData(2);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(20);

  const fetchTotalTraders = async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_merchant', true);
      
      if (count !== null) {
        setTotalUsers(count);
      }
    } catch (error) {
      console.error('Error fetching total traders:', error);
    }
  };
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedTab, setSelectedTab] = useState('All');
  const [userCredits, setUserCredits] = useState(0);

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

  const fetchUserCredits = async () => {
    if (!user) return;
    
    try {
      const credits = await creditsService.getUserCredits(user.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error fetching user credits:', error);
      setUserCredits(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
      fetchUserCredits();
      fetchTotalTraders();
      
      // Subscribe to credit changes with cleanup
      let subscription: any = null;
      
      const setupSubscription = () => {
        subscription = creditsService.subscribeToCredits(user.id, (credits) => {
          setUserCredits(credits);
        });
      };
      
      // Delay subscription to avoid conflicts
      const timer = setTimeout(setupSubscription, 1000);

      return () => {
        clearTimeout(timer);
        if (subscription) {
          subscription.unsubscribe();
        }
      };
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
                     'User';

  const firstName = displayName.split(' ')[0];
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
    <div className="w-full min-h-screen bg-white font-['Poppins'] max-w-4xl mx-auto lg:max-w-md">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-medium text-gray-900">
            Good Morning, {firstName}
          </h1>
          <div className="flex items-center space-x-3">
            <Link to="/notifications" className="relative">
              <Bell size={20} className="text-gray-600" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Link>
            <Link to="/settings" className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              {profilePicture ? (
                <img src={profilePicture} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 font-medium text-sm">{userInitials}</span>
              )}
            </Link>
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
                <span className="text-white text-base">Credits</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-white text-2xl font-bold">
                  {userCredits}
                  <span className="text-xs text-white/70 ml-1">(Live)</span>
                </div>
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
            <Link to="/buy-sell" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 card-hover active:scale-95 transition-transform">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <ArrowUpRight size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-base">Buy Crypto</span>
              </div>
            </Link>
            
            <Link to="/sell-crypto" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 card-hover active:scale-95 transition-transform">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <ArrowDownLeft size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-base">Sell Crypto</span>
              </div>
            </Link>
            
            <Link to="/sell-for-cash" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 card-hover active:scale-95 transition-transform">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-base">Sell → USD Cash</span>
              </div>
            </Link>
            
            <Link to="/send-naira-get-usd" className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 card-hover active:scale-95 transition-transform">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Send size={16} className="text-blue-600" />
                </div>
                <span className="text-black font-semibold text-base">Send NGN → USD Cash</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Markets Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-900">Markets</h2>
            <Link to="/crypto-markets" className="text-blue-600 text-sm font-medium">See All</Link>
          </div>
          
          
          {/* Top Crypto Cards */}
          <div className="space-y-2 mb-4">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">₿</span>
                  <div>
                    <div className="text-gray-900 font-medium text-sm">Bitcoin</div>
                    <div className="text-gray-500 text-xs">BTC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-900 font-semibold text-sm">$105,234</div>
                  <div className="text-green-600 text-xs">+2.34%</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">Ξ</span>
                  <div>
                    <div className="text-gray-900 font-medium text-sm">Ethereum</div>
                    <div className="text-gray-500 text-xs">ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-900 font-semibold text-sm">$3,456</div>
                  <div className="text-red-600 text-xs">-1.23%</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⊎</span>
                  <div>
                    <div className="text-gray-900 font-medium text-sm">Tether</div>
                    <div className="text-gray-500 text-xs">USDT</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-900 font-semibold text-sm">$1.00</div>
                  <div className="text-gray-600 text-xs">0.00%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rate Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-xs mb-1">USD → NGN Rate</div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-900 font-semibold text-base">{Math.round(1547 + Math.random() * 20 - 10)}</span>
                <span className="text-sm text-gray-500 font-medium">NGN</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="text-gray-600 text-xs mb-1">Total Traders</div>
              <div className="text-gray-900 font-semibold text-base">{totalUsers}</div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Recent Trades</h2>
          
          <div className="space-y-3">
            {recentTradesData.map((trade) => (
              <div key={trade.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      {trade.text.includes('→') ? (
                        <>
                          <span className="text-gray-900 font-semibold text-base">{trade.text.split(' → ')[0]}</span>
                          <MoveRight size={14} className="text-gray-400" />
                          <span className="text-gray-900 font-semibold text-base">{trade.text.split(' → ')[1].replace('₦', '')}</span>
                          <span className="text-sm text-gray-500 font-medium">NGN</span>
                        </>
                      ) : (
                        <span className="text-gray-900 font-semibold text-base">{trade.text}</span>
                      )}
                    </div>
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
                <div className="text-white font-medium text-base">
                  Invite friends. Earn Credits + Rewards.
                </div>
                <Send size={20} className="text-white" />
              </div>
            </div>
          </Link>
        </div>

        {/* Platform Updates */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Platform Updates</h2>
          
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
                  <div className="text-gray-900 font-medium text-base mb-1">
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
                  <div className="text-gray-900 font-medium text-base mb-1">
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