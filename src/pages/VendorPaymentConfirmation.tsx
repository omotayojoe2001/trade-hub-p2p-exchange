import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, DollarSign, AlertCircle, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VendorBottomNavigation from '@/components/vendor/VendorBottomNavigation';

const VendorPaymentConfirmation = () => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { notificationData } = location.state || {};

  useEffect(() => {
    if (notificationData) {
      setPaymentData(notificationData);
    }
  }, [notificationData]);

  const handleConfirmPayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      // Update cash trade status to confirmed
      await supabase
        .from('cash_trades')
        .update({
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.cash_trade_id);

      // Notify seller that vendor confirmed payment and will deliver cash
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentData.seller_id,
          type: 'vendor_confirmed_payment',
          title: 'Vendor Confirmed Payment',
          message: `Delivery agent confirmed payment. Your $${paymentData.amount_usd} USD cash will be delivered shortly.`,
          data: {
            cash_trade_id: paymentData.cash_trade_id,
            delivery_code: paymentData.delivery_code,
            amount_usd: paymentData.amount_usd,
            delivery_type: paymentData.delivery_type
          }
        });

      alert('✅ Payment confirmed! You can now proceed with cash delivery.');
      navigate('/vendor-cash-dashboard');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    try {
      // Update cash trade status to payment rejected
      await supabase
        .from('cash_trades')
        .update({
          status: 'payment_rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.cash_trade_id);

      // Notify buyer that payment was rejected
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentData.buyer_id,
          type: 'payment_rejected',
          title: 'Payment Rejected by Vendor',
          message: `Vendor did not receive ₦${paymentData.amount_naira?.toLocaleString()}. Please check payment and try again.`,
          data: {
            cash_trade_id: paymentData.cash_trade_id,
            amount_naira: paymentData.amount_naira
          }
        });

      alert('❌ Payment rejected. Buyer has been notified.');
      navigate('/vendor-cash-dashboard');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment data</h3>
          <p className="text-gray-500">Payment confirmation data not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">Confirm Payment Received</h1>
        <p className="text-sm text-gray-600">Verify you received the payment before proceeding</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Payment Details */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              Payment Verification Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">Expected Payment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Amount (Naira):</span>
                  <span className="font-bold text-blue-900">₦{paymentData.amount_naira?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">USD Equivalent:</span>
                  <span className="font-medium text-blue-900">${paymentData.amount_usd?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Delivery Type:</span>
                  <span className="font-medium text-blue-900">
                    {paymentData.delivery_type === 'delivery' ? 'Home Delivery' : 'Pickup'}
                  </span>
                </div>
              </div>
            </div>

            {paymentData.delivery_address && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Delivery Address</h4>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                  <span className="text-yellow-700 text-sm">{paymentData.delivery_address}</span>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Delivery Code</h4>
              <div className="text-center">
                <span className="text-3xl font-mono font-bold text-green-900">
                  {paymentData.delivery_code}
                </span>
                <p className="text-xs text-green-600 mt-1">
                  Customer will provide this code when receiving cash
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="text-orange-600 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-orange-700">
                <p className="font-medium mb-2">Before confirming:</p>
                <ul className="space-y-1">
                  <li>• Check your bank account for ₦{paymentData.amount_naira?.toLocaleString()}</li>
                  <li>• Verify the payment reference matches the trade</li>
                  <li>• Only confirm if you received the exact amount</li>
                  <li>• Once confirmed, you must deliver ${paymentData.amount_usd} USD cash</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Confirming...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, I Received ₦{paymentData.amount_naira?.toLocaleString()}
              </div>
            )}
          </Button>

          <Button
            onClick={handleRejectPayment}
            disabled={loading}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50 py-4"
          >
            No, I Did Not Receive Payment
          </Button>
        </div>
      </div>

      <VendorBottomNavigation />
    </div>
  );
};

export default VendorPaymentConfirmation;