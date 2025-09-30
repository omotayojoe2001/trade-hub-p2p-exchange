import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Clock, TrendingUp, ArrowUpDown, Banknote, Coins, Loader2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';

import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CryptoIcon from '@/components/CryptoIcon';

const TradeRequests = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [coinFilter, setCoinFilter] = useState('all');
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trade requests from Supabase
  useEffect(() => {
    const loadTradeRequests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Get trade requests available to current user as merchant
        const { data: requests, error: requestError } = await supabase
          .from('trade_requests')
          .select('*')
          .in('status', ['open', 'crypto_deposited']) // Include sell crypto requests
          .neq('user_id', user.id) // Exclude own requests
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });
          
        if (requestError) {
          console.error('Failed to load trade requests:', requestError);
          setError('Failed to load trade requests. Please try again.');
          setLoading(false);
          return;
        }

        // Transform the data to match our UI format
        const transformedRequests = (requests || []).map((request: any) => {
          const timeLeft = calculateTimeLeft(request.expires_at || new Date(Date.now() + 3600000).toISOString());
          const isPremiumCashDelivery = request.payment_method === 'premium_cash_delivery';

          return {
            id: request.id,
            userName: `User ${request.user_id?.slice(-4) || 'Unknown'}`,
            rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
            coin: request.crypto_type,
            amount: request.amount_crypto?.toString() || '0',
            rate: isPremiumCashDelivery 
              ? `$${request.rate?.toLocaleString() || 0}/${request.crypto_type}` 
              : `NGN ${request.rate?.toLocaleString() || 0}/${request.crypto_type}`,
            nairaAmount: isPremiumCashDelivery 
              ? `$${(request.amount_fiat || 0).toLocaleString()} USD Cash`
              : `₦${(request.amount_fiat || request.amount_crypto * request.rate || 0).toLocaleString()}`,
            timeLeft,
            paymentMethods: isPremiumCashDelivery ? ['Premium Cash Delivery'] : ['Bank Transfer'],
            type: request.trade_type || 'buy',
            direction: isPremiumCashDelivery
              ? `Premium user wants ${request.crypto_type} delivered as USD cash (crypto in escrow)`
              : request.trade_type === 'sell'
                ? `User wants to sell ${request.crypto_type} (crypto already in escrow)`
                : 'User wants to buy crypto from you',
            status: request.status,
            created_at: request.created_at,
            isPremium: isPremiumCashDelivery,
            deliveryAreas: request.delivery_areas,
            deliveryAddress: request.delivery_address
          };
        });

        setTradeRequests(transformedRequests);

      } catch (err) {
        console.error('Error loading trade requests:', err);
        setError('Failed to load trade requests');
        toast({
          title: "Error",
          description: "Failed to load trade requests. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTradeRequests();
  }, [user, toast]);

  const calculateTimeLeft = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  const getUserDisplayName = (userId: string): string => {
    return `User ${userId.slice(-4)}`;
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      // First assign merchant, then decline
      const { error: assignError } = await supabase
        .from('trade_requests')
        .update({ merchant_id: user.id })
        .eq('id', requestId);

      if (assignError) throw assignError;

      const { error } = await supabase
        .from('trade_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Trade Declined",
        description: "You have declined this trade request"
      });

      // Refresh the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to decline trade request",
        variant: "destructive"
      });
    }
  };

  const handleAcceptTrade = async (requestId: string) => {
    try {
      const request = tradeRequests.find(r => r.id === requestId);
      if (!request) {
        toast({ title: "Error", description: "Trade request not found.", variant: "destructive" });
        return;
      }

      // Accept via service (atomic + status guards)
      const { tradeRequestService } = await import('@/services/tradeRequestService');
      await tradeRequestService.acceptTradeRequest(requestId, user.id);

      toast({ title: "Trade Accepted", description: "You have successfully accepted this trade request.", duration: 3000 });

      // Navigate to the trade instead of trade request details since it's already accepted
      navigate('/messages');
    } catch (error: any) {
      console.error('Error accepting trade:', error);
      toast({ title: "Error", description: error.message || "Failed to accept trade. Please try again.", variant: "destructive", duration: 3000 });
    }
  };

  const filteredRequests = tradeRequests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoin = coinFilter === 'all' || request.coin === coinFilter;
    return matchesSearch && matchesCoin;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading trade requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/home')} className="mr-4">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Trade Requests</h1>
              <p className="text-sm text-gray-500">Incoming trade requests from users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="space-y-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={coinFilter} onValueChange={setCoinFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by coin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coins</SelectItem>
              <SelectItem value="BTC">Bitcoin</SelectItem>
              <SelectItem value="USDT">Tether</SelectItem>
              <SelectItem value="ETH">Ethereum</SelectItem>
              <SelectItem value="BNB">BNB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trade Requests List */}
      <div className="p-4 space-y-4">
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
            const isUserBuyingCrypto = request.type === 'buy';
            const merchantAction = isUserBuyingCrypto ? 'Send Crypto' : 'Send Cash';
            const userAction = isUserBuyingCrypto ? 'Send Cash' : 'Send Crypto';
            
            return (
              <Card key={request.id} className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <ArrowUpDown size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{request.userName}</h4>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">{request.rating} ★</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 text-xs">
                        <Clock size={12} className="mr-1" />
                        <span>{request.timeLeft}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trade Direction */}
                  <div className={`${request.isPremium ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3 mb-4`}>
                    <div className="flex items-center mb-2">
                      {request.isPremium && <Crown size={16} className="text-yellow-600 mr-2" />}
                      <ArrowUpDown size={16} className={`${request.isPremium ? 'text-yellow-600' : 'text-blue-600'} mr-2`} />
                      <span className={`font-semibold ${request.isPremium ? 'text-yellow-800' : 'text-blue-800'} text-sm`}>{request.direction}</span>
                    </div>
                    {request.isPremium && request.deliveryAreas && (
                      <div className="text-xs text-yellow-700">
                        Delivery Areas: {request.deliveryAreas.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Amount</p>
                      <div className="flex items-center">
                        <CryptoIcon symbol={request.coin} size={16} className="mr-1" />
                        <p className="font-semibold text-gray-900 text-sm">{request.amount} {request.coin}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Rate</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.rate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Value</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.nairaAmount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Payment Methods</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.paymentMethods.length}</p>
                    </div>
                  </div>

                  {/* Action Required */}
                  {!request.isPremium && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isUserBuyingCrypto ? (
                            <Coins size={16} className="text-yellow-600 mr-2" />
                          ) : (
                            <Banknote size={16} className="text-yellow-600 mr-2" />
                          )}
                          <span className="text-sm font-semibold text-yellow-800">
                            You need to: {merchantAction}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        User will: {userAction}
                      </p>
                    </div>
                  )}
                  
                  {/* Premium Action Required */}
                  {request.isPremium && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <Crown size={16} className="text-green-600 mr-2" />
                        <span className="text-sm font-semibold text-green-800">
                          Send Naira to vendor → Vendor delivers USD cash
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Crypto is already secured in escrow
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      className={`w-full ${request.isPremium ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 text-sm`}
                      onClick={() => {
                        if (request.isPremium) {
                          navigate(`/vendor-bank-details/${request.id}`);
                        } else if (request.type === 'sell') {
                          navigate('/sell-crypto-trade-request-details', { state: { tradeRequestId: request.id } });
                        } else {
                          navigate('/trade-request-details', { state: { request } });
                        }
                      }}
                    >
                      {request.isPremium ? 'Accept Premium Request' : request.type === 'sell' ? 'Accept & Send Cash' : 'Review'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 py-2 text-sm"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default TradeRequests;
