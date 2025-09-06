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

const SellCryptoWaiting: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [trade, setTrade] = useState<any>(null);

  // Get trade data from location state
  const sellData = location.state || {};
  const { amount, nairaAmount, cryptoType = 'USDT', tradeId, merchantName } = sellData;

  useEffect(() => {
    if (!user || !tradeId) {
      navigate('/sell-crypto');
      return;
    }

    fetchTradeData();
    
    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Set up real-time subscription for trade updates
    const channel = supabase
      .channel('trade-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trades',
        filter: `id=eq.${tradeId}`
      }, (payload) => {
        const updatedTrade = payload.new;
        if (updatedTrade.status === 'payment_sent') {
          toast({
            title: "Payment Sent!",
            description: "The merchant has sent your cash payment. Please check your bank account.",
          });
          setTrade(updatedTrade);
        }
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [user, tradeId]);

  const fetchTradeData = async () => {
    try {
      const { data: tradeData, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error) throw error;
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

      // Update trade status to payment received
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'payment_received',
          cash_payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      setPaymentReceived(true);

      // Notify merchant that payment has been confirmed
      await supabase
        .from('notifications')
        .insert({
          user_id: trade.buyer_id, // merchant
          type: 'trade_update',
          title: 'Payment Confirmed',
          message: `Customer has confirmed receipt of ${nairaAmount}. Crypto will be released.`,
          data: {
            trade_id: tradeId,
            amount_crypto: amount,
            crypto_type: cryptoType
          }
        });

      toast({
        title: "Payment Confirmed!",
        description: "The crypto is being released to the merchant.",
      });

      // Navigate to completion page
      navigate('/sell-crypto-completed', {
        state: {
          ...sellData,
          tradeId
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
        ...sellData,
        tradeId
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
            <CardTitle className="flex items-center text-blue-900">
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
              <span className="font-semibold">{merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Selling:</span>
              <span className="font-semibold">{amount} {cryptoType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receiving:</span>
              <span className="font-semibold text-green-600">{nairaAmount}</span>
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
              The merchant has been notified to send {nairaAmount} to your bank account.
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
        {trade?.status === 'payment_sent' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle2 className="text-green-600 mr-2" size={20} />
                <div>
                  <p className="font-semibold text-green-900">Payment Sent!</p>
                  <p className="text-sm text-green-700">
                    The merchant has sent your payment. Please check your bank account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleConfirmPayment}
            disabled={confirming || paymentReceived || trade?.status !== 'payment_sent'}
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
            ) : (
              "Confirm Payment Received"
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
                  Your {amount} {cryptoType} is safely held in escrow and will only be released after you confirm payment receipt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellCryptoWaiting;