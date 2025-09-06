import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Download, Star, ArrowRight, DollarSign, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';

const SellCryptoCompleted: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get trade data from location state
  const sellData = location.state || {};
  const { amount, nairaAmount, cryptoType = 'USDT', tradeId, merchantName } = sellData;

  useEffect(() => {
    if (!user || !tradeId) {
      navigate('/sell-crypto');
      return;
    }

    // Mark trade as completed and release crypto
    completeTrade();
  }, [user, tradeId]);

  const completeTrade = async () => {
    try {
      // Update trade status to completed
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'completed',
          crypto_released_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Create completion notification for merchant
      await supabase
        .from('notifications')
        .insert({
          user_id: sellData.merchantId,
          type: 'trade_completed',
          title: 'Trade Completed',
          message: `${amount} ${cryptoType} has been released to your wallet.`,
          data: {
            trade_id: tradeId,
            amount_crypto: amount,
            crypto_type: cryptoType
          }
        });

      // Create receipt
      await supabase
        .from('receipts')
        .insert({
          trade_id: tradeId,
          receipt_type: 'sell_crypto',
          receipt_data: {
            trade_id: tradeId,
            seller_id: user!.id,
            buyer_id: sellData.merchantId,
            amount_crypto: amount,
            crypto_type: cryptoType,
            amount_fiat: nairaAmount,
            merchant_name: merchantName,
            completed_at: new Date().toISOString(),
            escrow_address: sellData.escrowAddress
          }
        });

    } catch (error) {
      console.error('Error completing trade:', error);
    }
  };

  const generateReceipt = () => {
    const receiptData = {
      type: 'Crypto Sale',
      trade_id: tradeId,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      seller: 'You',
      buyer: merchantName,
      crypto_sold: `${amount} ${cryptoType}`,
      cash_received: nairaAmount,
      escrow_used: 'Yes',
      status: 'Completed'
    };

    // Store receipt in localStorage for download
    localStorage.setItem('sell_crypto_receipt', JSON.stringify(receiptData));
    
    toast({
      title: "Receipt Generated",
      description: "Trade receipt has been saved to your device.",
    });
  };

  const handleRateMerchant = () => {
    navigate('/rate-merchant', {
      state: {
        tradeId,
        merchantId: sellData.merchantId,
        merchantName,
        tradeType: 'sell'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Trade Completed!</h1>
          <p className="text-sm text-gray-500">Your crypto has been successfully sold</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Success Summary */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <DollarSign className="text-green-600 mr-2" size={24} />
                <span className="text-2xl font-bold text-green-900">{nairaAmount}</span>
              </div>
              <p className="text-green-800">has been sent to your bank account</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-green-700">
                <div className="flex items-center">
                  <Shield className="mr-1" size={14} />
                  <span>Secured with Escrow</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1" size={14} />
                  <span>Instant Settlement</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Trade ID:</span>
              <span className="font-mono text-sm">{tradeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-semibold">{merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Crypto Sold:</span>
              <span className="font-semibold">{amount} {cryptoType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cash Received:</span>
              <span className="font-semibold text-green-600">{nairaAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-semibold">₦{Math.round(parseFloat(nairaAmount.replace(/[^0-9.-]+/g, "")) / parseFloat(amount)).toLocaleString()}/{cryptoType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle2 size={12} className="mr-1" />
                Completed
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold">{new Date().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Trade initiated</p>
                <p className="text-xs text-gray-500">Merchant selected and escrow created</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Crypto deposited to escrow</p>
                <p className="text-xs text-gray-500">{amount} {cryptoType} secured in escrow</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Payment received</p>
                <p className="text-xs text-gray-500">{nairaAmount} sent to your bank account</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Crypto released</p>
                <p className="text-xs text-gray-500">Crypto transferred to merchant's wallet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={generateReceipt}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2" size={16} />
            Download Receipt
          </Button>

          <Button
            onClick={handleRateMerchant}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Star className="mr-2" size={16} />
            Rate This Merchant
          </Button>

          <Button
            onClick={() => navigate('/sell-crypto')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sell More Crypto
            <ArrowRight className="ml-2" size={16} />
          </Button>

          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>

        {/* Thank You Message */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-blue-900 mb-2">Thank you for using our platform!</h3>
            <p className="text-sm text-blue-700">
              Your trade was completed securely using our escrow system. 
              We hope you had a great experience.
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellCryptoCompleted;