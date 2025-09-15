import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Shield, DollarSign, MapPin, Clock, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PremiumCashDeliveryRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('premium-cash-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const loadRequests = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'trade_request')
        .contains('data', { order_type: 'premium_cash_delivery' })
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (notification) => {
    try {
      const orderId = notification.data?.order_id;
      if (!orderId) return;

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      // Update order status to merchant_accepted
      const { error: updateError } = await supabase
        .from('premium_cash_orders')
        .update({ 
          status: 'merchant_accepted',
          merchant_id: user.id
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Navigate to vendor bank details page
      navigate(`/vendor-bank-details/${orderId}`);

      toast({
        title: "Request Accepted!",
        description: "You've accepted the premium cash delivery request",
      });

      loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (notification) => {
    try {
      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      toast({
        title: "Request Declined",
        description: "You've declined the premium cash delivery request",
      });

      loadRequests();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Crown size={24} className="mr-2 text-yellow-500" />
                Premium Cash Delivery Requests
              </h1>
              <p className="text-gray-600 text-sm">Accept requests to earn from premium users</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
            {requests.length} Active
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {requests.length === 0 ? (
          <Card className="p-8 text-center bg-white">
            <Crown size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Premium Requests</h3>
            <p className="text-gray-600">
              Premium cash delivery requests will appear here when available
            </p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-4 bg-white border-yellow-200">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown size={20} className="text-yellow-500" />
                    <span className="font-semibold text-gray-900">Premium Cash Delivery</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleTimeString()}
                  </div>
                </div>

                {/* Request Details */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Crypto Amount:</span>
                      <div className="font-semibold">
                        {request.data?.crypto_amount} {request.data?.crypto_type}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">USD Cash:</span>
                      <div className="font-semibold text-green-600">
                        ${request.data?.usd_amount?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Areas:</span>
                      <div className="font-semibold">
                        {request.data?.delivery_areas?.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center space-x-1">
                        <Shield size={14} className="text-green-600" />
                        <span className="font-semibold text-green-600">Crypto in Escrow</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* How It Works */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">How Premium Cash Delivery Works:</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <div>1. Accept request → Send Naira to our vendor's bank account</div>
                    <div>2. Vendor delivers USD cash to customer's address</div>
                    <div>3. Customer confirms delivery → You receive crypto from escrow</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleAcceptRequest(request)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check size={16} className="mr-2" />
                    Accept & Send Payment
                  </Button>
                  <Button
                    onClick={() => handleDeclineRequest(request)}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X size={16} className="mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PremiumCashDeliveryRequests;