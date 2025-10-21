
import React, { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Bell, MessageCircle, Download, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import StickyHeader from '@/components/StickyHeader';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const BuySell = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);


  const { user, profile } = useAuth();
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
      // Get conversations where user is participant and has unread messages
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          messages!inner(
            id,
            is_read,
            sender_id
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .eq('messages.is_read', false)
        .neq('messages.sender_id', user.id);

      if (error) {
        console.error('Error fetching unread messages:', error);
        return;
      }

      // Count unique conversations with unread messages
      const unreadCount = conversations?.length || 0;
      setUnreadMessages(unreadCount);
    } catch (error) {
      console.error('Error in fetchUnreadMessages:', error);
    }
  };

  const fetchTradeRequests = async () => {
    if (!user) return;

    try {
      setLoadingRequests(true);

      // Fetch open trade requests for merchants
      const { data: requests, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('status', 'open')
        .gte('expires_at', new Date().toISOString()) // Only non-expired
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

  const handleSellCrypto = () => {
    navigate('/select-coin', { state: { mode: 'sell' } });
  };

  const handleBuyCrypto = () => {
    navigate('/select-coin', { state: { mode: 'buy' } });
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const profilePicture = profile?.avatar_url;

  return (
    <div className="min-h-screen bg-white pb-20 font-['Poppins']">
      <StickyHeader 
        title="Trade" 
        rightElement={
          <div className="flex items-center space-x-2">
            <button onClick={() => navigate('/notifications')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} className="text-gray-600" />
            </button>
          </div>
        }
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 h-[60px]">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-600 font-medium text-sm">{userInitials}</span>
          )}
        </div>
        
        <h1 className="text-lg font-medium text-gray-900">Trade</h1>
        
        <div className="flex items-center space-x-2">
          {profile?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings size={20} className="text-blue-600" />
            </button>
          )}
          <button onClick={() => navigate('/notifications')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="px-4 space-y-3 mb-4">
        {/* Buy Crypto Card */}
        <div 
          className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 cursor-pointer card-hover active:scale-98 transition-all duration-150"
          onClick={handleBuyCrypto}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-full flex items-center justify-center mr-4">
                <Download size={20} className="text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Buy Crypto</h3>
                <p className="text-sm text-[#6B7280] mb-1">Send NGN, Receive BTC/USDT</p>
                <p className="text-xs text-[#9CA3AF]">Fast processing</p>
              </div>
            </div>
            <Button className="bg-[#0052FF] text-white rounded-full px-4 py-2 h-9 text-sm font-bold">
              Start →
            </Button>
          </div>
        </div>

        {/* Sell Crypto Card */}
        <div 
          className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 cursor-pointer card-hover active:scale-98 transition-all duration-150"
          onClick={handleSellCrypto}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-full flex items-center justify-center mr-4">
                <Upload size={20} className="text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Sell Crypto</h3>
                <p className="text-sm text-[#6B7280] mb-1">Send BTC/USDT, Receive NGN</p>
                <p className="text-xs text-[#9CA3AF]">Secure escrow</p>
              </div>
            </div>
            <Button className="bg-[#0052FF] text-white rounded-full px-4 py-2 h-9 text-sm font-bold">
              Start →
            </Button>
          </div>
        </div>

        {/* Sell Crypto → Get Cash Card */}
        <div 
          className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 cursor-pointer card-hover active:scale-98 transition-all duration-150"
          onClick={() => navigate('/sell-for-cash')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-full flex items-center justify-center mr-4">
                <DollarSign size={20} className="text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Sell Crypto → Get Cash (Pickup/Delivery)</h3>
                <p className="text-sm text-[#6B7280] mb-1">Send BTC/USDT, Receive USD Cash</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#9CA3AF]">Handled by vendor</p>
                  <button className="text-xs text-[#0052FF] underline">Credits Required</button>
                </div>
              </div>
            </div>
            <Button className="bg-[#0052FF] text-white rounded-full px-4 py-2 h-9 text-sm font-bold">
              Start →
            </Button>
          </div>
        </div>

        {/* Send Naira → Get USD Cash Card */}
        <div 
          className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 cursor-pointer card-hover active:scale-98 transition-all duration-150"
          onClick={() => navigate('/send-naira-get-usd')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-full flex items-center justify-center mr-4">
                <Wallet size={20} className="text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Send Naira → Get USD Cash</h3>
                <p className="text-sm text-[#6B7280] mb-1">Pay in NGN, Receive USD Cash</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#9CA3AF]">Direct vendor conversion</p>
                  <button className="text-xs text-[#0052FF] underline">Credits Required</button>
                </div>
              </div>
            </div>
            <Button className="bg-[#0052FF] text-white rounded-full px-4 py-2 h-9 text-sm font-bold">
              Start →
            </Button>
          </div>
        </div>
      </div>

      {/* Helper Text / Guidance */}
      <div className="px-4 mb-4">
        <p className="text-sm text-[#6B7280] mb-2">
          Not sure? If funding with Naira, start with Buy Crypto.
        </p>
        <button className="text-sm text-[#0052FF] font-bold">
          How Escrow Works →
        </button>
      </div>

      {/* Trade Requests Section */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900">Trade Requests</h4>
          <button 
            onClick={() => navigate('/trade-requests')}
            className="text-sm text-[#0052FF] font-medium"
          >
            See All →
          </button>
        </div>
        
        {loadingRequests ? (
          <div className="w-full h-20 bg-[#F8F9FA] rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tradeRequests.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {tradeRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-blue-600 text-xs font-bold">{request.crypto_type?.charAt(0) || 'T'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Trade Request</p>
                      <span className="text-green-500 text-xs">★ New</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">
                      {request.trade_type === 'buy' ? 'Wants to Buy:' : 'Wants to Sell:'}
                    </span>
                    <p className="font-medium">{request.amount_crypto || request.amount} {request.crypto_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">For:</span>
                    <p className="font-medium">₦{(request.amount_fiat || request.naira_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-[#0052FF] text-white rounded-full h-8 text-xs font-bold"
                  onClick={() => navigate('/trade-requests')}
                >
                  Accept Request
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <div className="w-full h-16 bg-[#F8F9FA] rounded-xl flex items-center justify-center">
              <p className="text-sm text-[#6B7280]">No trade requests available</p>
            </div>
            <div className="w-full h-16 bg-[#F8F9FA] rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              <p className="text-xs text-[#9CA3AF]">Waiting for new requests...</p>
            </div>
          </div>
        )}
      </div>


      <BottomNavigation />
    </div>
  );
};

export default BuySell;
