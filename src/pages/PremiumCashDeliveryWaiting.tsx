import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Shield, Clock, CheckCircle, AlertCircle, Truck, DollarSign } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumCashDeliveryWaiting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const { orderId } = location.state || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/premium-cash-delivery');
      return;
    }
    fetchOrder();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_cash_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!order) return { title: 'Loading...', description: '', icon: Clock, color: 'gray' };

    switch (order.status) {
      case 'awaiting_merchant':
        return {
          title: 'Finding Merchant',
          description: 'Your crypto is secured in escrow. We\'re notifying merchants about your USD cash delivery request.',
          icon: Clock,
          color: 'blue'
        };
      case 'merchant_accepted':
        return {
          title: 'Merchant Found!',
          description: 'A merchant has accepted your trade and is sending payment to our vendor.',
          icon: CheckCircle,
          color: 'green'
        };
      case 'payment_sent':
        return {
          title: 'Payment Sent to Vendor',
          description: 'Merchant has sent payment to our vendor. Cash delivery is being prepared.',
          icon: DollarSign,
          color: 'green'
        };
      case 'out_for_delivery':
        return {
          title: 'Out for Delivery',
          description: 'Our vendor is on the way to deliver your USD cash!',
          icon: Truck,
          color: 'blue'
        };
      case 'completed':
        return {
          title: 'Delivery Complete',
          description: 'Cash delivered successfully! Your crypto has been released to the merchant.',
          icon: CheckCircle,
          color: 'green'
        };
      default:
        return {
          title: 'Processing',
          description: 'Your order is being processed.',
          icon: Clock,
          color: 'blue'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-dashboard" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Shield size={24} className="mr-2 text-gray-600" />
                Cash Delivery Status
              </h1>
              <p className="text-gray-600 text-sm">Order #{orderId?.slice(-8)}</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              statusInfo.color === 'green' ? 'bg-green-100' : 
              statusInfo.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <StatusIcon size={32} className={`${
                statusInfo.color === 'green' ? 'text-green-600' : 
                statusInfo.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{statusInfo.title}</h2>
              <p className="text-gray-600 mt-2">{statusInfo.description}</p>
            </div>
          </div>
        </Card>

        {/* Order Details */}
        {order && (
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Crypto Amount:</span>
                <span className="font-medium">{order.crypto_amount} {order.crypto_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">USD Cash Amount:</span>
                <span className="font-medium">${order.naira_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Areas:</span>
                <span className="font-medium">{order.selected_areas?.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Address:</span>
                <span className="font-medium text-right max-w-48 truncate">{order.delivery_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium">{order.phone_number}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Progress Steps */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="font-medium text-green-900">Crypto Secured in Escrow</p>
                <p className="text-xs text-green-700">Your crypto is safely held until delivery</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {order?.status === 'awaiting_merchant' ? (
                <Clock size={20} className="text-blue-600 animate-pulse" />
              ) : (
                <CheckCircle size={20} className="text-green-600" />
              )}
              <div>
                <p className={`font-medium ${order?.status === 'awaiting_merchant' ? 'text-blue-900' : 'text-green-900'}`}>
                  Merchant Assignment
                </p>
                <p className={`text-xs ${order?.status === 'awaiting_merchant' ? 'text-blue-700' : 'text-green-700'}`}>
                  {order?.status === 'awaiting_merchant' ? 'Finding merchant...' : 'Merchant found and accepted'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {['payment_sent', 'out_for_delivery', 'completed'].includes(order?.status) ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <Clock size={20} className="text-gray-400" />
              )}
              <div>
                <p className={`font-medium ${['payment_sent', 'out_for_delivery', 'completed'].includes(order?.status) ? 'text-green-900' : 'text-gray-600'}`}>
                  Payment to Vendor
                </p>
                <p className={`text-xs ${['payment_sent', 'out_for_delivery', 'completed'].includes(order?.status) ? 'text-green-700' : 'text-gray-500'}`}>
                  Merchant sends payment to our vendor
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {order?.status === 'completed' ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <Clock size={20} className="text-gray-400" />
              )}
              <div>
                <p className={`font-medium ${order?.status === 'completed' ? 'text-green-900' : 'text-gray-600'}`}>
                  Cash Delivery
                </p>
                <p className={`text-xs ${order?.status === 'completed' ? 'text-green-700' : 'text-gray-500'}`}>
                  Vendor delivers USD cash to your address
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Support */}
        <Card className="p-4 bg-white border-gray-200">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Need Help?</p>
              <p className="text-sm text-gray-600 mb-3">
                If you have any questions or concerns about your delivery, our support team is here to help.
              </p>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumCashDeliveryWaiting;