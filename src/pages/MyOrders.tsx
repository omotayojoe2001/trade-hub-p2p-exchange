import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, Copy, Phone, ArrowRight, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BottomNavigation from '@/components/BottomNavigation';
import ConfirmationDialog from '@/components/ConfirmationDialog';

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
  vendor_name?: string;
  vendor_user_id?: string;
}

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<CashOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{
    otherUserId: string;
    otherUserName: string;
    cashTradeId: string;
  } | null>(null);
  const [showCopySuccessDialog, setShowCopySuccessDialog] = useState(false);
  const [showVendorNotFoundDialog, setShowVendorNotFoundDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('cash_trades')
        .select(`
          *,
          vendors!inner(
            user_id,
            display_name
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include vendor info
      const transformedOrders = (data || []).map(order => ({
        ...order,
        vendor_user_id: order.vendors?.user_id,
        vendor_name: order.vendors?.display_name || 'Vendor'
      }));
      
      setOrders(transformedOrders);
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
    setShowCopySuccessDialog(true);
  };



  return (
    <>
      <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">My Cash Orders</h1>
        <p className="text-sm text-gray-600">Track your cash delivery orders</p>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
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
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <p className="font-semibold text-sm">${order.usd_amount.toLocaleString()}</p>
                      <Badge variant={statusInfo.color === 'green' ? 'default' : 'secondary'} className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800 text-xs px-2 py-1`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Delivery Info & Code */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-600">
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </p>
                    </div>
                    {order.delivery_code && (
                      <div className="flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs font-mono font-bold text-yellow-800">
                          {order.delivery_code}
                        </span>
                        <Button
                          onClick={() => copyDeliveryCode(order.delivery_code)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-yellow-100"
                        >
                          <Copy className="w-3 h-3 text-yellow-600" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => navigate(`/cash-trade-status/${order.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                    >
                      Details
                    </Button>
                    <Button
                      onClick={() => {
                        if (order.vendor_user_id) {
                          setSelectedMessage({
                            otherUserId: order.vendor_user_id,
                            otherUserName: order.vendor_name || 'Vendor',
                            cashTradeId: order.id
                          });
                        } else {
                          setShowVendorNotFoundDialog(true);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
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

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showCopySuccessDialog}
        onClose={() => setShowCopySuccessDialog(false)}
        onConfirm={() => setShowCopySuccessDialog(false)}
        title="Code Copied!"
        message="Delivery code has been copied to your clipboard."
        confirmText="OK"
        cancelText="Close"
        type="success"
      />

      <ConfirmationDialog
        isOpen={showVendorNotFoundDialog}
        onClose={() => setShowVendorNotFoundDialog(false)}
        onConfirm={() => setShowVendorNotFoundDialog(false)}
        title="Vendor Not Found"
        message="Unable to find vendor information for this order. Please try again later."
        confirmText="OK"
        cancelText="Close"
        type="warning"
      />
    </>
  );
};

export default MyOrders;