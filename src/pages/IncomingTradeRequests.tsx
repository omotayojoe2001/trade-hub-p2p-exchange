import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService, TradeRequest } from '@/services/tradeRequestService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const IncomingTradeRequests = () => {
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadTradeRequests();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('incoming-trade-requests')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'trade_requests'
        }, () => {
          loadTradeRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const loadTradeRequests = async () => {
    try {
      setLoading(true);
      
      // Get all open trade requests excluding current user's requests
      const { data: requests, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('status', 'open')
        .neq('user_id', user?.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading trade requests:', error);
        throw error;
      }

      // Get user profiles for request creators
      const userIds = requests?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const transformedRequests: TradeRequest[] = requests?.map(request => {
        const profile = profiles?.find(p => p.user_id === request.user_id);
        return {
          id: request.id,
          user_id: request.user_id,
          trade_type: request.trade_type as 'buy' | 'sell',
          coin_type: request.crypto_type as 'BTC' | 'ETH' | 'USDT',
          amount: request.amount_crypto,
          naira_amount: request.amount_fiat,
          rate: request.rate,
          payment_method: request.payment_method,
          status: request.status as 'open' | 'accepted' | 'completed' | 'cancelled',
          expires_at: request.expires_at,
          created_at: request.created_at,
          merchant_name: profile?.display_name || 'Anonymous User',
          merchant_rating: 5.0,
          merchant_trade_count: 0
        };
      }) || [];

      setTradeRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading trade requests:', error);
      toast({
        title: "Error",
        description: "Failed to load trade requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.id) return;
    
    try {
      setProcessing(requestId);
      
      await tradeRequestService.acceptTradeRequest(requestId, user.id);
      
      toast({
        title: "Trade Request Accepted",
        description: "You have successfully accepted the trade request"
      });
      
      // Refresh the list
      loadTradeRequests();
      
      // Navigate to trade details or chat
      navigate('/messages');
      
    } catch (error: any) {
      console.error('Error accepting trade request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept trade request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!user?.id) return;
    
    try {
      setProcessing(requestId);
      
      await tradeRequestService.declineTradeRequest(requestId, user.id);
      
      toast({
        title: "Trade Request Declined",
        description: "You have declined the trade request"
      });
      
      // Refresh the list
      loadTradeRequests();
      
    } catch (error: any) {
      console.error('Error declining trade request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to decline trade request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Incoming Trade Requests</h1>
        </div>
        <div className="p-4 text-center">Loading trade requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Incoming Trade Requests</h1>
        </div>
        <Badge variant="secondary">{tradeRequests.length} pending</Badge>
      </div>

      <div className="p-4 space-y-4">
        {tradeRequests.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trade Requests</h3>
            <p className="text-muted-foreground">
              No incoming trade requests at the moment. Check back later!
            </p>
          </div>
        ) : (
          tradeRequests.map((request) => (
            <Card key={request.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {request.merchant_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{request.merchant_name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{request.merchant_rating}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={request.trade_type === 'buy' ? 'default' : 'secondary'}>
                    {request.trade_type === 'buy' ? 'Wants to Buy' : 'Wants to Sell'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amount</span>
                    <p className="font-semibold">{request.amount} {request.coin_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value</span>
                    <p className="font-semibold">₦{request.naira_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rate</span>
                    <p className="font-semibold">₦{request.rate.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment</span>
                    <p className="font-semibold">{request.payment_method}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatTimeRemaining(request.expires_at)}</span>
                  </div>
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={processing === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === request.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDeclineRequest(request.id)}
                    disabled={processing === request.id}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default IncomingTradeRequests;