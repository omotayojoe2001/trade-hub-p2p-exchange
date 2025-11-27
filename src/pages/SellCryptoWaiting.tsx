import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, DollarSign, Shield, MessageCircle, Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';
import { useCustomAlert } from '@/components/ui/custom-alert';

const SellCryptoWaiting: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm, AlertComponent } = useCustomAlert();
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [trade, setTrade] = useState<any>(null);

  // Get trade data from location state
  const sellData = location.state || {};
  const { tradeRequestId, coinType, cryptoAmount, netAmount, selectedAccount, selectedMerchant } = sellData;

  useEffect(() => {
    if (!user || !tradeRequestId) {
      navigate('/buy-sell');
      return;
    }

    fetchTradeData();
    
    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Set up real-time subscription for trade request updates
    const channel = supabase
      .channel('trade-request-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trade_requests',
        filter: `id=eq.${tradeRequestId}`
      }, (payload) => {
        const updatedTrade = payload.new;
        console.log('Real-time update:', updatedTrade);
        setTrade(updatedTrade);
        
        if (updatedTrade.status === 'buyer_paid') {
          toast({
            title: "Buyer Has Paid!",
            description: "The buyer has sent payment. Check your bank account and confirm when received.",
          });
        } else if (updatedTrade.status === 'payment_sent') {
          toast({
            title: "Payment Sent!",
            description: "The merchant has sent your cash payment. Please check your bank account.",
          });
        }
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [user, tradeRequestId]);

  const fetchTradeData = async () => {
    try {
      const { data: tradeData, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (error) throw error;
      console.log('Trade data fetched:', tradeData);
      setTrade(tradeData);
    } catch (error) {
      console.error('Error fetching trade data:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirming(true);

      // Update trade request status to payment received
      const { error } = await supabase
        .from('trade_requests')
        .update({ 
          status: 'completed'
        })
        .eq('id', tradeRequestId);

      if (error) throw error;

      setPaymentReceived(true);

      // Notify merchant that payment has been confirmed and crypto is being released
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedMerchant.user_id,
          type: 'trade_completed',
          title: 'Trade Completed - Crypto Released',
          message: `Customer confirmed receipt of ₦${netAmount?.toLocaleString()}. ${cryptoAmount} ${coinType} has been released to your wallet address.`,
          data: {
            trade_request_id: tradeRequestId,
            amount_crypto: cryptoAmount,
            crypto_type: coinType,
            amount_fiat: netAmount
          }
        });

      toast({
        title: "Payment Confirmed!",
        description: "The crypto is being released to the merchant.",
      });

      // Navigate to completion page
      navigate('/sell-crypto-completed', {
        state: {
          tradeRequestId,
          coinType,
          cryptoAmount,
          netAmount,
          selectedMerchant
        }
      });

    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleDispute = () => {
    navigate('/sell-crypto-dispute', {
      state: {
        tradeRequestId,
        coinType,
        cryptoAmount,
        netAmount,
        selectedMerchant
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Waiting for Payment</h1>
              <p className="text-sm text-gray-500">Step 2: Confirm cash payment receipt</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock size={14} className="mr-1" />
            In Progress
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Shield className="mr-2" size={20} />
              Trade Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-blue-800">
            <div className="flex items-center">
              <CheckCircle2 className="text-green-600 mr-2" size={16} />
              <span className="text-sm">Crypto deposited to escrow</span>
            </div>
            <div className="flex items-center">
              <Clock className="text-orange-600 mr-2" size={16} />
              <span className="text-sm">Waiting for merchant to send cash payment</span>
            </div>
            <div className="flex items-center opacity-50">
              <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2"></div>
              <span className="text-sm">Confirm payment receipt</span>
            </div>
            <div className="flex items-center opacity-50">
              <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2"></div>
              <span className="text-sm">Crypto released to merchant</span>
            </div>
          </CardContent>
        </Card>

        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-semibold">{selectedMerchant?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Selling:</span>
              <span className="font-semibold">{cryptoAmount} {coinType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receiving:</span>
              <span className="font-semibold text-green-600">₦{netAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Account:</span>
              <span className="font-semibold">{selectedAccount?.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time elapsed:</span>
              <span className="font-semibold text-orange-600">{formatTime(timeElapsed)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center">
              <DollarSign className="mr-2" size={20} />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-yellow-800">
            <p className="text-sm">
              The merchant has been notified to send ₦{netAmount?.toLocaleString()} to your {selectedAccount?.bank_name} account.
            </p>
            <p className="text-sm">
              Once you receive the payment in your bank account, click "Confirm Payment Received" below.
            </p>
            <p className="text-sm font-semibold">
              ⚠️ Only confirm after you see the money in your account!
            </p>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {(trade?.status === 'buyer_paid' || trade?.status === 'payment_sent') && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle2 className="text-green-600 mr-2" size={20} />
                <div>
                  <p className="font-semibold text-green-900">
                    {trade?.status === 'buyer_paid' ? 'Buyer Has Paid!' : 'Payment Sent!'}
                  </p>
                  <p className="text-sm text-green-700">
                    {trade?.status === 'buyer_paid' 
                      ? 'The buyer has sent payment to your account. Please check and confirm when received.'
                      : 'The merchant has sent your payment. Please check your bank account.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={async () => {
              const confirmed = await confirm(
                '⚠️ CRITICAL WARNING ⚠️',
                `Only click YES if you have ACTUALLY RECEIVED ₦${netAmount?.toLocaleString()} in your bank account.\n\nClicking YES will:\n• Immediately release ${cryptoAmount} ${coinType} to the merchant\n• Complete the trade permanently\n• This action CANNOT be undone\n\nHave you confirmed the money is in your bank account?`
              );
              
              if (confirmed) {
                const doubleConfirm = await confirm(
                  'FINAL CONFIRMATION',
                  `You are about to release ${cryptoAmount} ${coinType} worth ₦${netAmount?.toLocaleString()}.\n\nThis is your LAST CHANCE to cancel.\n\nAre you 100% sure you received the payment?`
                );
                
                if (doubleConfirm) {
                  handleConfirmPayment();
                }
              }
            }}
            disabled={confirming || paymentReceived || (trade?.status !== 'payment_sent' && trade?.status !== 'buyer_paid')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            {confirming ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Confirming...
              </div>
            ) : paymentReceived ? (
              <div className="flex items-center">
                <CheckCircle2 className="mr-2" size={16} />
                Payment Confirmed
              </div>
            ) : trade?.status === 'buyer_paid' || trade?.status === 'payment_sent' ? (
              "Confirm Payment Received"
            ) : (
              "Waiting for Buyer Payment..."
            )}
          </Button>

          {/* Communication */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex items-center">
              <MessageCircle className="mr-2" size={16} />
              Chat
            </Button>
            <Button variant="outline" className="flex items-center">
              <Phone className="mr-2" size={16} />
              Call
            </Button>
          </div>

          {/* Dispute */}
          <Button
            variant="outline"
            onClick={handleDispute}
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            Report Issue / Dispute
          </Button>
        </div>

        {/* Security Note */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Shield className="text-blue-600 mr-2 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-semibold text-gray-900">Your crypto is secure</p>
                <p className="text-xs text-gray-600 mt-1">
                  Your {cryptoAmount} {coinType} is safely held in escrow and will only be released after you confirm payment receipt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
      <AlertComponent />
    </div>
  );
};

export default SellCryptoWaiting;