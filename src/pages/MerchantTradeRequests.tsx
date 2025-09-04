import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, User, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService } from '@/services/tradeRequestService';
import BottomNavigation from '@/components/BottomNavigation';

interface TradeRequest {
  id: string;
  user_id: string;
  trade_type: 'buy' | 'sell';
  coin_type: string;
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method: string;
  status: 'open' | 'accepted' | 'cancelled';
  notes?: string;
  created_at: string;
  user_profile?: {
    display_name: string;
    user_type: string;
  };
}

const MerchantTradeRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchTradeRequests();

    // Set up real-time subscription for new trade requests
    const channel = supabase
      .channel('merchant-trade-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trade_requests',
        filter: `status=eq.open`
      }, (payload) => {
        console.log('New trade request:', payload);
        fetchTradeRequests(); // Refresh the list
        
        // Show notification for new trade request
        toast({
          title: "New Trade Request!",
          description: `Someone wants to trade ${payload.new.amount} ${payload.new.coin_type}`,
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trade_requests'
      }, (payload) => {
        console.log('Trade request updated:', payload);
        fetchTradeRequests(); // Refresh the list
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTradeRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get open trade requests that could be for this merchant
      const { data: requests, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trade requests:', error);
        toast({
          title: "Error",
          description: "Failed to load trade requests",
          variant: "destructive"
        });
        return;
      }

      if (!requests || requests.length === 0) {
        setTradeRequests([]);
        return;
      }

      // Get user profiles for the trade requests
      const userIds = requests.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, user_type')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine requests with user profiles
      const formattedRequests = requests.map(request => ({
        ...request,
        user_profile: profiles?.find(p => p.user_id === request.user_id) || {
          display_name: 'Unknown User',
          user_type: 'customer'
        }
      }));

      setTradeRequests(formattedRequests);
    } catch (error) {
      console.error('Error in fetchTradeRequests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeRequestId: string) => {
    if (!user) return;

    try {
      setProcessingId(tradeRequestId);
      
      const trade = await tradeRequestService.acceptTradeRequest(tradeRequestId, user.id);
      
      toast({
        title: "Trade Accepted!",
        description: "The customer has been notified. Escrow process will begin.",
      });

      // Refresh the list
      fetchTradeRequests();
      
      // Navigate to trade management page
      navigate(`/trade-management/${trade.id}`);
      
    } catch (error) {
      console.error('Error accepting trade:', error);
      toast({
        title: "Error",
        description: "Failed to accept trade request",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTrade = async (tradeRequestId: string) => {
    if (!user) return;

    try {
      setProcessingId(tradeRequestId);
      
      await tradeRequestService.cancelTradeRequest(tradeRequestId, user.id);
      
      toast({
        title: "Trade Declined",
        description: "The trade request has been declined",
      });

      // Refresh the list
      fetchTradeRequests();
      
    } catch (error) {
      console.error('Error rejecting trade:', error);
      toast({
        title: "Error",
        description: "Failed to decline trade request",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trade requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Trade Requests</h1>
              <p className="text-sm text-gray-600">
                {tradeRequests.length} pending requests
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            Merchant
          </Badge>
        </div>
      </div>

      <div className="p-4">
        {tradeRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Trade Requests</h3>
                <p className="text-gray-600">
                  You'll see new trade requests here when customers want to trade with you.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tradeRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {request.user_profile?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getTimeAgo(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {request.trade_type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold">{request.amount} {request.coin_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold">₦{request.naira_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rate</p>
                      <p className="font-semibold">₦{request.rate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment</p>
                      <p className="font-semibold">{request.payment_method.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{request.notes}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleAcceptTrade(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      {processingId === request.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Accept Trade
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleRejectTrade(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MerchantTradeRequests;
