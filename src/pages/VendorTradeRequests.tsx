import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, MapPin, Phone, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface VendorTradeRequest {
  id: string;
  trade_request_id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  merchant_name?: string;
  merchant_phone?: string;
}

const VendorTradeRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<VendorTradeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTradeRequests();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('vendor-trade-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cash_trades'
      }, () => {
        loadTradeRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTradeRequests = async () => {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const { data, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: VendorTradeRequest[] = (data || []).map(trade => ({
        id: trade.id,
        trade_request_id: trade.trade_request_id,
        usd_amount: trade.usd_amount,
        delivery_type: trade.delivery_type,
        delivery_address: trade.delivery_address,
        pickup_location: trade.pickup_location,
        status: trade.status,
        created_at: trade.created_at,
        customer_name: trade.customer_name || 'Customer',
        customer_phone: trade.customer_phone || trade.seller_phone,
        merchant_name: trade.merchant_name || 'Merchant',
        merchant_phone: trade.merchant_phone
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading trade requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vendor_paid': return 'bg-red-100 text-red-800';
      case 'payment_confirmed': return 'bg-orange-100 text-orange-800';
      case 'delivery_in_progress': return 'bg-blue-100 text-blue-800';
      case 'cash_delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vendor_paid': return 'Confirm Payment';
      case 'payment_confirmed': return 'Start Delivery';
      case 'delivery_in_progress': return 'In Progress';
      case 'cash_delivered': return 'Delivered';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendor/dashboard')}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Trade Requests</h1>
            <p className="text-sm text-gray-600">Manage your delivery assignments</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trade Requests</h3>
            <p className="text-gray-500">
              You'll see trade requests here when merchants assign deliveries to you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card 
                key={request.id} 
                className="bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/vendor/delivery/${request.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center">
                      <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                      ${request.usd_amount.toLocaleString()} USD
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="w-3 h-3 text-gray-500 mr-2" />
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-1 font-medium">{request.customer_name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 text-gray-500 mr-2" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-1 font-medium">{request.customer_phone}</span>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="w-3 h-3 text-gray-500 mr-2 mt-0.5" />
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-1 font-medium flex-1">
                        {request.delivery_type === 'delivery' 
                          ? request.delivery_address 
                          : request.pickup_location
                        }
                      </span>
                    </div>
                    
                    {request.merchant_name && (
                      <div className="flex items-center">
                        <User className="w-3 h-3 text-green-500 mr-2" />
                        <span className="text-gray-600">Merchant:</span>
                        <span className="ml-1 font-medium text-green-700">{request.merchant_name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorTradeRequests;