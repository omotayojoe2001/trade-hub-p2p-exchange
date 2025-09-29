import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, Copy, Phone, ArrowRight, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BottomNavigation from '@/components/BottomNavigation';
import PageTransition from '@/components/animations/PageTransition';
import MessageThread from '@/components/MessageThread';

interface CashOrder {
  id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  delivery_code: string;
  status: string;
  created_at: string;
  vendor_phone?: string;
  vendor_name?: string;
}

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<CashOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<{
    otherUserId: string;
    otherUserName: string;
    cashTradeId: string;
  } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'vendor_paid':
        return { label: 'Vendor Paid', color: 'orange', icon: Clock };
      case 'payment_confirmed':
        return { label: 'Payment Confirmed', color: 'blue', icon: CheckCircle };
      case 'delivery_in_progress':
        return { label: 'Out for Delivery', color: 'purple', icon: Package };
      case 'cash_delivered':
        return { label: 'Delivered', color: 'green', icon: CheckCircle };
      default:
        return { label: 'Pending', color: 'gray', icon: Clock };
    }
  };

  const copyDeliveryCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Delivery code copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">My Cash Orders</h1>
        <p className="text-sm text-gray-600">Track your cash delivery orders</p>
      </div>

      <div className="p-4 space-y-3">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-4">You haven't placed any cash orders yet.</p>
              <Button onClick={() => navigate('/buy-sell')}>
                Order Cash Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              // Always show code if it exists

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-base">${order.usd_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={statusInfo.color === 'green' ? 'default' : 'secondary'} className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800 text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                  {/* Delivery Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium">
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Code - Compact */}
                  {order.delivery_code && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-yellow-700 flex items-center">
                            <Lock className="w-3 h-3 mr-1" />
                            Code
                          </p>
                          <p className="text-lg font-mono font-bold text-yellow-900">
                            {order.delivery_code}
                          </p>
                        </div>
                        <Button
                          onClick={() => copyDeliveryCode(order.delivery_code)}
                          variant="outline"
                          size="sm"
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 h-8 w-8 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => navigate(`/cash-trade-status/${order.id}`)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={async () => {
                        // Get real vendor user_id from cash_trades table
                        const { data: cashTrade } = await supabase
                          .from('cash_trades')
                          .select('vendor_id, vendors!inner(user_id, display_name)')
                          .eq('id', order.id)
                          .single();
                        
                        const vendorUserId = cashTrade?.vendors?.user_id;
                        const vendorName = cashTrade?.vendors?.display_name || 'Vendor';
                        
                        if (vendorUserId) {
                          setSelectedMessage({
                            otherUserId: vendorUserId,
                            otherUserName: vendorName,
                            cashTradeId: order.id
                          });
                        } else {
                          alert('Vendor not found for this order');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Message
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      </div>
      <BottomNavigation />
      
      {/* Message Thread */}
      {selectedMessage && (
        <MessageThread
          otherUserId={selectedMessage.otherUserId}
          otherUserName={selectedMessage.otherUserName}
          cashTradeId={selectedMessage.cashTradeId}
          contextType="cash_delivery"
          isOpen={true}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </PageTransition>
  );
};

export default MyOrders;