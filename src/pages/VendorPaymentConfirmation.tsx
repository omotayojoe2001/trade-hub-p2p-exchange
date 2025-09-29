import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, DollarSign, User, Phone, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PaymentDetails {
  id: string;
  usd_amount: number;
  naira_amount?: number;
  merchant_name?: string;
  status: string;
  created_at: string;
}

const VendorPaymentConfirmation = () => {
  const { deliveryId, orderId, id } = useParams();
  const tradeId = deliveryId || orderId || id;
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadPaymentDetails();
  }, [tradeId]);

  const loadPaymentDetails = async () => {
    try {
      if (!tradeId) {
        console.error('🚨 DEBUG: No trade ID provided');
        return;
      }
      
      console.log('🔍 DEBUG: Loading payment details for trade ID:', tradeId);
      
      const { data, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      console.log('🔍 DEBUG: Cash trade query result:', { data, error });
      console.log('🔍 DEBUG: Buyer ID from cash trade:', data?.buyer_id);
      console.log('🔍 DEBUG: Seller ID from cash trade:', data?.seller_id);
      console.log('🔍 DEBUG: Vendor ID from cash trade:', data?.vendor_id);

      if (error) throw error;
      
      // Get merchant details from buyer_id
      let merchantName = 'Merchant';
      
      if (data.buyer_id) {
        console.log('🔍 DEBUG: Fetching merchant profile for buyer_id:', data.buyer_id);
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', data.buyer_id)
          .single();
        
        console.log('🔍 DEBUG: User profile query result:', { profile, profileError });
        
        if (profile) {
          merchantName = profile.full_name || 'Merchant';
          console.log('✅ DEBUG: Found merchant in user_profiles:', { merchantName });
        } else {
          console.log('❌ DEBUG: No user_profiles found, trying profiles table');
          
          const { data: altProfile, error: altError } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', data.buyer_id)
            .single();
          
          console.log('🔍 DEBUG: Profiles table query result:', { altProfile, altError });
          
          if (altProfile) {
            merchantName = altProfile.display_name || 'Merchant';
            console.log('✅ DEBUG: Found merchant in profiles table:', merchantName);
          } else {
            console.log('❌ DEBUG: No merchant found in either table');
          }
        }
      } else {
        console.log('❌ DEBUG: No buyer_id in cash trade record');
        // Use existing merchant_name from cash trade or default
        merchantName = data.merchant_name || 'Merchant Payment';
        console.log('🔍 DEBUG: Using fallback merchant name:', merchantName);
      }
      
      const paymentData = {
        ...data,
        merchant_name: merchantName
      };
      
      console.log('🔍 DEBUG: Final payment data:', paymentData);
      setPayment(paymentData);
    } catch (error) {
      console.error('Error loading payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!payment) return;
    
    // Check if already confirmed
    if (payment.status === 'vendor_confirmed' || payment.status === 'completed') {
      alert('Payment already confirmed!');
      navigate(`/vendor/delivery-details/${payment.id}`);
      return;
    }
    
    setConfirming(true);
    try {
      const { error } = await supabase.rpc('confirm_vendor_payment', {
        cash_trade_id: payment.id
      });
      
      if (error) throw error;
      
      alert('Payment confirmed! Crypto released to merchant.');
      navigate(`/vendor/delivery-details/${payment.id}`);
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
          <Button onClick={() => navigate('/vendor/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendor/dashboard')}
            className="mr-3 text-black hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-black">Confirm Payment</h1>
            <p className="text-sm text-gray-600">Verify payment received</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Payment Amount */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Payment Amount</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-black mb-1">
              NGN {payment.naira_amount?.toLocaleString() || (payment.usd_amount * 1650).toLocaleString()}
            </p>
            <p className="text-sm text-black">
              (${payment.usd_amount.toLocaleString()} USD equivalent)
            </p>
          </div>
        </div>

        {/* Merchant Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            Payment From
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-medium text-gray-900">{payment.merchant_name || 'Merchant'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-900">{new Date(payment.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="p-1 bg-orange-100 rounded-full mr-3 mt-0.5">
              <span className="block w-2 h-2 bg-orange-500 rounded-full"></span>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">
                Important: Verify Payment
              </p>
              <p className="text-sm text-orange-700">
                Only confirm after checking your bank account. This will release crypto to the merchant.
              </p>
            </div>
          </div>
        </div>

        {payment.status === 'vendor_confirmed' || payment.status === 'completed' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-lg font-semibold text-green-800 mb-2">Payment Already Confirmed</p>
            <p className="text-sm text-green-600 mb-4">This payment has been processed successfully</p>
            <Button
              onClick={() => navigate(`/vendor/delivery-details/${payment.id}`)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              View Delivery Details
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConfirmPayment}
            disabled={confirming}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-lg"
          >
            {confirming ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Confirming Payment...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm Payment Received
              </div>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VendorPaymentConfirmation;