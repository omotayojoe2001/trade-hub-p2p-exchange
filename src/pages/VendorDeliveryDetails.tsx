import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MapPin, Phone, User, DollarSign, Clock, AlertTriangle, CreditCard, Truck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { exchangeRateService } from '@/services/exchangeRateService';

interface DeliveryDetails {
  id: string;
  trade_request_id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  delivery_code: string;
  seller_phone?: string;
  merchant_name?: string;
  merchant_phone?: string;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_full_address?: string;
  naira_amount?: number;
  payment_confirmed_by_vendor?: boolean;
  crypto_released_to_merchant?: boolean;
}

const VendorDeliveryDetails = () => {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeValidated, setCodeValidated] = useState(false);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);
  const [showPaymentErrorDialog, setShowPaymentErrorDialog] = useState(false);
  const [showDeliveryErrorDialog, setShowDeliveryErrorDialog] = useState(false);
  const [showCodeValidDialog, setShowCodeValidDialog] = useState(false);
  const [showCodeInvalidDialog, setShowCodeInvalidDialog] = useState(false);
  const [showCodeRequiredDialog, setShowCodeRequiredDialog] = useState(false);
  const [showDeliveryFailedDialog, setShowDeliveryFailedDialog] = useState(false);
  const [usdToNgnRate, setUsdToNgnRate] = useState(1650);

  useEffect(() => {
    loadExchangeRate();
    loadDeliveryDetails();
  }, [deliveryId]);

  const loadExchangeRate = async () => {
    try {
      const rate = await exchangeRateService.getUSDToNGNRate();
      setUsdToNgnRate(Math.round(rate));
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    }
  };

  const loadDeliveryDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      setDelivery(data);
    } catch (error) {
      console.error('Error loading delivery details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!delivery) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('confirm_vendor_payment', {
        cash_trade_id: delivery.id
      });
      
      if (error) throw error;
      
      // Reload delivery details to show updated status
      await loadDeliveryDetails();
      setShowPaymentSuccessDialog(true);
    } catch (error) {
      console.error('Error confirming payment:', error);
      setShowPaymentErrorDialog(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!delivery) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('start_delivery_process', {
        cash_trade_id: delivery.id
      });
      
      if (error) throw error;
      
      await loadDeliveryDetails();
    } catch (error) {
      console.error('Error starting delivery:', error);
      setShowDeliveryErrorDialog(true);
    } finally {
      setProcessing(false);
    }
  };

  const validateDeliveryCode = () => {
    if (enteredCode.toUpperCase() === delivery?.delivery_code?.toUpperCase()) {
      setCodeValidated(true);
      setShowCodeValidDialog(true);
    } else {
      setShowCodeInvalidDialog(true);
      setEnteredCode('');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!delivery || !codeValidated) {
      setShowCodeRequiredDialog(true);
      return;
    }
    
    setProcessing(true);
    try {
      await supabase
        .from('cash_trades')
        .update({ 
          status: 'cash_delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', delivery.id);

      // Notify customer that delivery is complete
      await supabase
        .from('notifications')
        .insert({
          user_id: delivery.seller_id,
          type: 'cash_delivered',
          title: '🎉 Cash Delivered!',
          message: `Your $${delivery.usd_amount} USD cash has been delivered successfully.`,
          data: {
            cash_trade_id: delivery.id,
            amount: delivery.usd_amount
          }
        });

      navigate('/vendor/dashboard');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      setShowDeliveryFailedDialog(true);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Delivery Not Found</h2>
          <Button onClick={() => navigate('/vendor/dashboard')}>Back to Dashboard</Button>
        </div>
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
            <h1 className="text-xl font-semibold text-gray-900">Delivery Details</h1>
            <p className="text-sm text-gray-600">${delivery.usd_amount.toLocaleString()} USD Cash Delivery</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Payment Summary - Compact */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-slate-600 mr-2" />
              <span className="text-sm font-medium text-slate-700">Payment</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              ₦{delivery.naira_amount?.toLocaleString() || (delivery.usd_amount * usdToNgnRate).toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-slate-600">
            Deliver: ${delivery.usd_amount.toLocaleString()} USD • From: {delivery.merchant_name || 'Merchant'}
          </div>
        </div>

        {/* Customer Info - Compact */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <User className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Customer Details</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="w-12 text-blue-600">Name:</span>
              <span className="font-medium">{delivery.customer_name || 'Customer'}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-3 h-3 text-blue-600 mr-1" />
              <span className="w-11 text-blue-600">Phone:</span>
              <span className="font-medium">{delivery.customer_phone || delivery.seller_phone || 'Not provided'}</span>
            </div>
            <div className="flex items-start">
              <MapPin className="w-3 h-3 text-blue-600 mr-1 mt-0.5" />
              <span className="w-11 text-blue-600">Address:</span>
              <span className="font-medium flex-1">
                {delivery.delivery_type === 'delivery' 
                  ? delivery.customer_full_address || delivery.delivery_address || 'Address not provided'
                  : delivery.pickup_location || 'Pickup location'
                }
              </span>
            </div>
          </div>
        </div>



        {/* Instructions - Compact */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-800">Instructions</span>
          </div>
          <div className="text-xs text-orange-700 space-y-1">
            <p>• Contact customer: {delivery.customer_phone || delivery.seller_phone}</p>
            <p>• Bring exactly ${delivery.usd_amount.toLocaleString()} USD cash</p>
            <p>• Ask customer for their secret delivery code</p>
            <p>• Enter code in app to validate before giving cash</p>
            <p>• Only give cash AFTER code validation succeeds</p>
          </div>
        </div>

        {/* STEP 1: Payment Confirmation - Blue Theme */}
        {delivery.status === 'vendor_paid' && !delivery.payment_confirmed_by_vendor && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-lg font-bold text-blue-800">STEP 1: Payment Confirmation</span>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Confirm you received:</strong>
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  ₦{delivery.naira_amount?.toLocaleString() || (delivery.usd_amount * usdToNgnRate).toLocaleString()} NGN
                </p>
                <p className="text-xs text-blue-600">
                  From merchant: {delivery.merchant_name}
                </p>
              </div>
              <p className="text-xs text-blue-700">
                This will release crypto from escrow to the merchant.
              </p>
            </div>
            <Button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Confirming Payment...
                </div>
              ) : (
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Confirm Payment Received
                </div>
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Start Delivery - Orange Theme */}
        {delivery.status === 'payment_confirmed' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                <span className="text-lg font-bold text-orange-800">STEP 2: Start Delivery</span>
              </div>
              <div className="bg-white border border-orange-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-orange-700 mb-2">
                  <strong>Payment confirmed!</strong> Crypto released to merchant.
                </p>
                <p className="text-lg font-bold text-orange-900">
                  Now deliver ${delivery.usd_amount.toLocaleString()} USD cash to customer
                </p>
              </div>
            </div>
            <Button
              onClick={handleStartDelivery}
              disabled={processing}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Starting Delivery...
                </div>
              ) : (
                <div className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Start Delivery Process
                </div>
              )}
            </Button>
          </div>
        )}

        {/* STEP 3: Delivery Confirmation - Green Theme */}
        {delivery.status === 'delivery_in_progress' && (
          <div className="space-y-4">
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <Lock className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-lg font-bold text-green-800">STEP 3: Delivery Confirmation</span>
              </div>
              
              <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-green-700 mb-3">
                  <strong>Ask customer for their delivery code:</strong>
                </p>
                
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                    placeholder="Enter customer's code"
                    className="flex-1 px-3 py-3 border-2 border-green-300 rounded-lg text-center font-mono text-lg tracking-wider uppercase font-bold"
                    maxLength={6}
                    disabled={codeValidated}
                  />
                  <Button
                    onClick={validateDeliveryCode}
                    disabled={!enteredCode || codeValidated}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    {codeValidated ? 'Valid' : 'Validate'}
                  </Button>
                </div>
                
                {codeValidated && (
                  <div className="bg-green-100 border-2 border-green-400 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-bold">
                      Code validated! Give ${delivery.usd_amount.toLocaleString()} USD to customer.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleConfirmDelivery}
              disabled={processing || !codeValidated}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold disabled:bg-gray-400"
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Confirming Delivery...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {codeValidated ? 'Confirm Cash Delivered' : 'Validate Code First'}
                </div>
              )}
            </Button>
          </div>
        )}

        {delivery.status === 'cash_delivered' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-semibold text-green-800">Delivery Completed</p>
            <p className="text-sm text-green-600">Thank you for your service!</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showPaymentSuccessDialog}
        onClose={() => setShowPaymentSuccessDialog(false)}
        onConfirm={() => setShowPaymentSuccessDialog(false)}
        title="Payment Confirmed!"
        message="Crypto has been released to the merchant. You can now proceed with delivery."
        confirmText="Continue"
        cancelText="Close"
        type="success"
      />

      <ConfirmationDialog
        isOpen={showPaymentErrorDialog}
        onClose={() => setShowPaymentErrorDialog(false)}
        onConfirm={() => setShowPaymentErrorDialog(false)}
        title="Payment Confirmation Failed"
        message="Failed to confirm payment. Please try again or contact support."
        confirmText="Try Again"
        cancelText="Close"
        type="warning"
      />

      <ConfirmationDialog
        isOpen={showDeliveryErrorDialog}
        onClose={() => setShowDeliveryErrorDialog(false)}
        onConfirm={() => setShowDeliveryErrorDialog(false)}
        title="Delivery Start Failed"
        message="Failed to start delivery process. Please try again."
        confirmText="Try Again"
        cancelText="Close"
        type="warning"
      />

      <ConfirmationDialog
        isOpen={showCodeValidDialog}
        onClose={() => setShowCodeValidDialog(false)}
        onConfirm={() => setShowCodeValidDialog(false)}
        title="Code Validated!"
        message="Delivery code is correct! You can now confirm delivery and give cash to customer."
        confirmText="Continue"
        cancelText="Close"
        type="success"
      />

      <ConfirmationDialog
        isOpen={showCodeInvalidDialog}
        onClose={() => setShowCodeInvalidDialog(false)}
        onConfirm={() => setShowCodeInvalidDialog(false)}
        title="Invalid Code"
        message="The entered code is incorrect. Please ask customer for the correct delivery code."
        confirmText="Try Again"
        cancelText="Close"
        type="warning"
      />

      <ConfirmationDialog
        isOpen={showCodeRequiredDialog}
        onClose={() => setShowCodeRequiredDialog(false)}
        onConfirm={() => setShowCodeRequiredDialog(false)}
        title="Code Validation Required"
        message="Please validate the delivery code first before confirming delivery."
        confirmText="OK"
        cancelText="Close"
        type="warning"
      />

      <ConfirmationDialog
        isOpen={showDeliveryFailedDialog}
        onClose={() => setShowDeliveryFailedDialog(false)}
        onConfirm={() => setShowDeliveryFailedDialog(false)}
        title="Delivery Confirmation Failed"
        message="Failed to confirm delivery. Please try again or contact support."
        confirmText="Try Again"
        cancelText="Close"
        type="warning"
      />
    </div>
  );
};

export default VendorDeliveryDetails;