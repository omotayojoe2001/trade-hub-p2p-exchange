import React, { useState, useEffect } from 'react';
import { Crown, Search, Filter, Clock, TrendingUp, ArrowUpDown, Banknote, Coins, Loader2, Star, Zap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService, TradeRequest as TradeRequestType } from '@/services/tradeRequestService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CryptoIcon from '@/components/CryptoIcon';

// Real-time trade request interface
interface TradeRequest {
  id: string;
  user_id: string;
  trade_type: 'buy' | 'sell';
  coin_type: string;
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method?: string;
  bank_account_details?: any;
  notes?: string;
  status: string;
  expires_at: string;
  matched_user_id?: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    full_name: string;
    rating: number;
    trade_count: number;
    verification_level: string;
  };
  // Display properties (non-conflicting names)
  display_name?: string;
  display_rating?: number;
  display_coin?: string;
  display_amount?: string;
  display_rate?: string;
  display_naira_amount?: string;
  display_time_left?: string;
  display_payment_methods?: string[];
  display_type?: string;
  display_direction?: string;
  display_is_premium?: boolean;
  display_trade_count?: number;
  verificationLevel?: string;
  originalRequest?: any;
}

const PremiumTradeRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [coinFilter, setCoinFilter] = useState('all');
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<any>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);

  // Check for active codes
  useEffect(() => {
    const checkActiveCode = () => {
      const storedCode = localStorage.getItem('activeTradeCode');
      if (storedCode) {
        try {
          const codeData = JSON.parse(storedCode);
          if (codeData.status !== 'completed') {
            setActiveCode(codeData);
          }
        } catch (error) {
          console.error('Error parsing active code:', error);
        }
      }
    };

    checkActiveCode();

    // Listen for new codes
    const handleNewTradeCode = () => checkActiveCode();
    window.addEventListener('newTradeCode', handleNewTradeCode);

    return () => window.removeEventListener('newTradeCode', handleNewTradeCode);
  }, []);

  // Load trade requests from Supabase
  useEffect(() => {
    const loadTradeRequests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get real trade requests from Supabase
        const requests = await tradeRequestService.getOpenTradeRequests();
        
        // Transform requests for display
        const transformedRequests = requests.map((request: TradeRequestType) => {
          const timeLeft = calculateTimeLeft(request.expires_at);

          return {
            id: request.id,
            user_id: request.user_id,
            trade_type: request.trade_type,
            coin_type: request.coin_type,
            amount: request.amount,
            naira_amount: request.naira_amount,
            rate: request.rate,
            payment_method: request.payment_method,
            status: request.status,
            expires_at: request.expires_at,
            created_at: request.created_at,
            updated_at: request.created_at, // Use created_at as fallback
            notes: request.notes,
            // Display properties
            display_name: request.merchant_name || 'Anonymous User',
            display_rating: request.merchant_rating || 5.0,
            display_coin: request.coin_type,
            display_amount: request.amount.toString(),
            display_rate: `₦${request.rate.toLocaleString()}/${request.coin_type}`,
            display_naira_amount: `₦${request.naira_amount.toLocaleString()}`,
            display_time_left: timeLeft,
            display_payment_methods: [request.payment_method || 'Bank Transfer'],
            display_type: request.trade_type,
            display_direction: request.trade_type === 'sell'
              ? 'User wants to sell crypto to you'
              : 'User wants to buy crypto from you',
            display_is_premium: false, // Will be enhanced later
            display_trade_count: request.merchant_trade_count || 0,
            verificationLevel: 'basic',
            originalRequest: request
          } as TradeRequest;
        });

        setTradeRequests(transformedRequests);
      } catch (error) {
        console.error('Error loading trade requests:', error);
        setError('Failed to load trade requests');
        toast({
          title: "Error",
          description: "Failed to load trade requests. Using demo mode.",
          variant: "destructive"
        });
        // Set empty array on error - user can create new requests
        setTradeRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadTradeRequests();

    // Set up real-time subscription for new trade requests
    const channel = supabase
      .channel('trade_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_requests'
      }, (payload) => {
        console.log('Trade request change:', payload);
        loadTradeRequests(); // Reload data on changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const calculateTimeLeft = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${Math.max(1, 60 - diffInMinutes)}m left`;
    } else if (diffInMinutes < 1440) {
      const hoursLeft = Math.max(1, 24 - Math.floor(diffInMinutes / 60));
      return `${hoursLeft}h left`;
    } else {
      return 'Expired';
    }
  };

  const getUserDisplayName = (userId: string): string => {
    return `User ${userId.slice(-4)}`;
  };

  const handleAcceptTrade = async (requestId: string) => {
    if (acceptingRequest) return; // Prevent double-clicking

    try {
      setAcceptingRequest(requestId);

      // Accept the trade request in Supabase
      const trade = await tradeRequestService.acceptTradeRequest(requestId, user.id);

      const request = tradeRequests.find(r => r.id === requestId);
      if (request) {
        toast({
          title: "Trade Request Accepted!",
          description: `You've accepted the ${request.trade_type} request for ${request.amount} ${request.coin_type}`,
        });
      }

      // Navigate to trade details page
      navigate('/trade-details', {
        state: {
          trade: trade
        }
      });

    } catch (error) {
      console.error('Error accepting trade:', error);
      toast({
        title: "Error",
        description: "Failed to accept trade request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAcceptingRequest(null);
    }
  };

  const handleViewDetails = (requestId: string) => {
    const request = tradeRequests.find(r => r.id === requestId);
    navigate('/premium-trade-request-details', {
      state: { request }
    });
  };

  const filteredRequests = tradeRequests.filter(request => {
    const matchesSearch = (request.display_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoin = coinFilter === 'all' || request.coin_type === coinFilter;
    return matchesSearch && matchesCoin;
  });

  const availableCoins = [...new Set(tradeRequests.map(r => r.coin_type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading premium trade requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowUpDown size={24} className="mr-2 text-gray-600" />
              Trade Requests
            </h1>
            <p className="text-gray-600 text-sm">Premium incoming trade requests</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="p-4">
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Premium Request Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredRequests.length}</div>
              <div className="text-xs text-gray-600">Active Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredRequests.filter(r => r.display_is_premium).length}</div>
              <div className="text-xs text-gray-600">Premium Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
        </Card>

        {/* Create New Request Button */}
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Create Your Own Request</h3>
              <p className="text-sm text-gray-600">Set your own rates and terms</p>
            </div>
            <Button
              onClick={() => navigate('/create-trade-request')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Plus size={16} className="mr-2" />
              Create Request
            </Button>
          </div>
        </Card>
      </div>

      {/* Active Code Alert */}
      {activeCode && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold text-red-900">Active Order Code</div>
                <div className="text-sm text-red-700">
                  {activeCode.orderType === 'pickup' ? 'Cash Pickup' : 'Cash Delivery'} - {activeCode.amount} {activeCode.currency}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-900">{activeCode.code}</div>
              <div className="text-xs text-red-600">Show this code to collect</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="px-4 pb-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={coinFilter} onValueChange={setCoinFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coins</SelectItem>
              {availableCoins.map(coin => (
                <SelectItem key={coin} value={coin}>{coin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trade Requests List */}
      <div className="px-4 space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trade Requests</h3>
              <p className="text-gray-600">You don't have any pending trade requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const isUserBuyingCrypto = request.trade_type === 'buy';
            const merchantAction = isUserBuyingCrypto ? 'Send Crypto' : 'Send Cash';
            const userAction = isUserBuyingCrypto ? 'Send Cash' : 'Send Crypto';
            
            return (
              <Card key={request.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleAcceptTrade(request.id)}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 relative">
                        <ArrowUpDown size={16} className="text-gray-600" />
                        {request.display_is_premium && (
                          <Crown size={12} className="absolute -top-1 -right-1 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 text-sm">{request.display_name}</h4>
                          {request.display_is_premium && (
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                              Premium
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star size={12} className="text-yellow-400 mr-1 fill-current" />
                          <span className="text-xs text-gray-500">{request.display_rating?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 text-xs">
                        <Clock size={12} className="mr-1" />
                        {request.display_time_left}
                      </div>
                      {request.display_is_premium && (
                        <div className="flex items-center text-yellow-600 text-xs mt-1">
                          <Zap size={12} className="mr-1" />
                          Priority
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Amount</p>
                      <div className="flex items-center">
                        <CryptoIcon symbol={request.coin_type} size={16} className="mr-1" />
                        <p className="font-semibold text-gray-900 text-sm">{request.amount} {request.coin_type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Rate</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.rate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Value</p>
                      <p className="font-semibold text-gray-900 text-sm">₦{request.naira_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Payment Methods</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.payment_method || 'Bank Transfer'}</p>
                    </div>
                  </div>

                  {/* Action Required */}
                  <div className={`${request.display_is_premium ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 mb-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isUserBuyingCrypto ? (
                          <Coins size={16} className={`${request.display_is_premium ? 'text-yellow-600' : 'text-gray-600'} mr-2`} />
                        ) : (
                          <Banknote size={16} className={`${request.display_is_premium ? 'text-yellow-600' : 'text-gray-600'} mr-2`} />
                        )}
                        <span className={`text-sm font-semibold ${request.display_is_premium ? 'text-yellow-800' : 'text-gray-800'}`}>
                          You need to: {merchantAction}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs ${request.display_is_premium ? 'text-yellow-700' : 'text-gray-700'} mt-1`}>
                      User will: {userAction}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(request.id);
                      }}
                      className="py-2 text-sm"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptTrade(request.id);
                      }}
                      disabled={acceptingRequest === request.id}
                      className={`py-2 text-sm ${
                        request.display_is_premium
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                      } text-white`}
                    >
                      {acceptingRequest === request.id ? (
                        <Loader2 size={14} className="mr-2 animate-spin" />
                      ) : (
                        request.display_is_premium && <Crown size={14} className="mr-2" />
                      )}
                      {acceptingRequest === request.id ? 'Accepting...' : 'Accept Trade'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTradeRequests;
