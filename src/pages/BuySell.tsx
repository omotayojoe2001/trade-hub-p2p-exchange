
import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, HelpCircle, Clock, Shield, List, User, UserCheck, MessageCircle, Zap, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const BuySell = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { isQuickAuthActive } = useQuickAuth();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real trade requests
  useEffect(() => {
    if (user) {
      fetchTradeRequests();
      fetchUnreadMessages();
    }
  }, [user]);

  const fetchUnreadMessages = async () => {
    if (!user) return;

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error fetching unread messages:', error);
        return;
      }

      setUnreadMessages(messages?.length || 0);
    } catch (error) {
      console.error('Error in fetchUnreadMessages:', error);
    }
  };

  const fetchTradeRequests = async () => {
    if (!user) return;

    try {
      setLoadingRequests(true);

      // Fetch recent open trade requests (excluding current user's requests)
      const { data: requests, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('status', 'open')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        console.error('Error fetching trade requests:', error);
        return;
      }

      setTradeRequests(requests || []);

    } catch (error) {
      console.error('Error in fetchTradeRequests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Redirect premium users to premium trade page
  React.useEffect(() => {
    if (user && isPremium) {
      navigate('/premium-trade');
    }
  }, [user, isPremium, navigate]);

  const handleSellCrypto = () => {
    // Premium users go to premium merchant choice, regular users to coin selection  
    if (isPremium) {
      navigate('/premium-merchant-choice', { state: { mode: 'sell' } });
    } else {
      navigate('/select-coin', { state: { mode: 'sell' } });
    }
  };

  const handleBuyCrypto = () => {
    // Premium users go to premium merchant choice, regular users to coin selection
    if (isPremium) {
      navigate('/premium-merchant-choice', { state: { mode: 'buy' } });
    } else {
      navigate('/select-coin', { state: { mode: 'buy' } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">Central Exchange</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/trade-requests')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
          >
            <List size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
          </button>

        </div>
      </div>

      {/* Title Section */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Buy or Sell Crypto</h1>
        <p className="text-gray-600 dark:text-gray-400">Start a new trade by choosing what you want to do.</p>
      </div>

      {/* Trade Options */}
      <div className="p-4 space-y-4">
        {/* Buy Crypto Card */}
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
            hoveredCard === 'buy' ? 'shadow-lg border-blue-300 transform scale-105' : 'hover:shadow-md'
          }`}
          onMouseEnter={() => setHoveredCard('buy')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={handleBuyCrypto}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 transition-colors ${
                hoveredCard === 'buy' ? 'bg-blue-200' : ''
              }`}>
                <ArrowUpRight size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-blue-600 mb-1 transition-colors ${
                  hoveredCard === 'buy' ? 'text-blue-700' : ''
                }`}>Buy Crypto</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Send ₦, Receive BTC/USDT</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">You have Naira, want to get crypto</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <HelpCircle size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <Clock size={14} className="mr-1" />
              <span>Fast processing</span>
            </div>
            <Button className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all ${
              hoveredCard === 'buy' ? 'bg-blue-600 shadow-md' : ''
            }`}>
              Start
            </Button>
          </div>
        </div>

        {/* Sell Crypto Card */}
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
            hoveredCard === 'sell' ? 'shadow-lg border-green-300 transform scale-105' : 'hover:shadow-md'
          }`}
          onMouseEnter={() => setHoveredCard('sell')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={handleSellCrypto}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className={`w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 transition-colors ${
                hoveredCard === 'sell' ? 'bg-green-200' : ''
              }`}>
                <ArrowDownLeft size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-gray-900 mb-1 transition-colors ${
                  hoveredCard === 'sell' ? 'text-green-700' : ''
                }`}>Sell Crypto</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Send BTC/USDT, Receive ₦</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">You have crypto, want to get cash</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <HelpCircle size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <Shield size={14} className="mr-1" />
              <span>Secure escrow</span>
            </div>
            <Button 
              variant="outline" 
              className={`border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-all ${
                hoveredCard === 'sell' ? 'border-green-300 bg-green-50 text-green-700' : ''
              }`}
            >
              Start
            </Button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mx-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <HelpCircle size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800 dark:text-gray-200 text-sm mb-2">
                <span className="font-medium">Not sure? Tap Buy if you're funding with Naira.</span>
              </p>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                How Escrow Works? →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Requests */}
      <div className="mx-4 mb-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Trade Requests</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Available offers from merchants</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/trade-requests')}
              className="text-blue-600 hover:text-blue-700"
            >
              See All →
            </Button>
          </div>
          
          {loadingRequests ? (
            <div className="text-center py-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-xs">Loading requests...</p>
            </div>
          ) : tradeRequests.length > 0 ? (
            <div className="space-y-3">
              {tradeRequests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Trader
                        </p>
                        <div className="flex items-center">
                          <span className="text-yellow-500 text-xs">★ 4.5</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-500">
                        {request.trade_type === 'buy' ? 'Buying:' : 'Selling:'}
                      </span>
                      <p className="font-medium">{request.amount_crypto} {request.crypto_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-medium">₦{request.amount_fiat?.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1"
                    onClick={() => navigate('/trade-request-details', { state: { request: request } })}
                  >
                    View Request
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <List className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No active trade requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Shortcut */}
      <div className="mx-4 mb-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Messages</h4>
                <p className="text-gray-600 text-sm">
                  {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}` : 'No unread messages'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/messages')}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              View All
            </Button>
          </div>
        </div>
      </div>


      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default BuySell;
