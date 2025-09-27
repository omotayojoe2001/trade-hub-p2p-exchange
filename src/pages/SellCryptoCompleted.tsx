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
  const { tradeRequestId, coinType = 'USDT', cryptoAmount, netAmount, selectedMerchant } = sellData;
  
  // Use the correct variable names from the sell crypto flow
  const amount = cryptoAmount;
  const nairaAmount = `NGN ${netAmount?.toLocaleString() || '0'}`;
  const cryptoType = coinType;
  const tradeId = tradeRequestId;
  const merchantName = selectedMerchant?.display_name || 'Merchant';

  useEffect(() => {
    if (!user || !tradeId) {
      navigate('/buy-sell');
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
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sell Crypto Receipt - Central Exchange</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8f9fa; }
            .receipt { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
            .header p { color: #6b7280; margin: 5px 0 0 0; }
            .section { margin: 25px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
            .row { display: flex; justify-content: space-between; margin: 12px 0; padding: 10px 0; }
            .row:not(:last-child) { border-bottom: 1px solid #f3f4f6; }
            .label { font-weight: 600; color: #4b5563; }
            .value { font-weight: 500; color: #111827; }
            .success { color: #059669; font-weight: bold; font-size: 18px; }
            .total-row { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
            .status-badge { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="receipt">
            <div class="header">
                <h1>Sell Crypto Receipt</h1>
                <p>Central Exchange P2P Platform</p>
                <div style="margin-top: 15px;">
                    <span class="status-badge">✓ COMPLETED</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Transaction Details</div>
                <div class="row">
                    <span class="label">Transaction ID:</span>
                    <span class="value" style="font-family: monospace;">${tradeId}</span>
                </div>
                <div class="row">
                    <span class="label">Date & Time:</span>
                    <span class="value">${new Date().toLocaleString()}</span>
                </div>
                <div class="row">
                    <span class="label">Trade Type:</span>
                    <span class="value">Sell Crypto</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Trade Summary</div>
                <div class="row">
                    <span class="label">Amount Sold:</span>
                    <span class="value">${amount} ${cryptoType}</span>
                </div>
                <div class="row">
                    <span class="label">Exchange Rate:</span>
                    <span class="value">₦${Math.round((netAmount || 0) / parseFloat(amount || '1')).toLocaleString()}/${cryptoType}</span>
                </div>
                <div class="row">
                    <span class="label">Gross Amount:</span>
                    <span class="value">${nairaAmount}</span>
                </div>
                <div class="row">
                    <span class="label">Platform Fee (0.5%):</span>
                    <span class="value">₦${Math.round((netAmount || 0) * 0.005).toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <div class="row" style="margin: 0; padding: 0; border: none;">
                        <span class="label" style="font-size: 18px;">Net Amount Received:</span>
                        <span class="success">${nairaAmount}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Merchant Information</div>
                <div class="row">
                    <span class="label">Merchant:</span>
                    <span class="value">${merchantName}</span>
                </div>
                <div class="row">
                    <span class="label">Payment Method:</span>
                    <span class="value">Bank Transfer</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Security Information</div>
                <div class="row">
                    <span class="label">Escrow Status:</span>
                    <span class="value" style="color: #059669;">✓ Funds Released</span>
                </div>
                <div class="row">
                    <span class="label">Payment Verified:</span>
                    <span class="value" style="color: #059669;">✓ Confirmed</span>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Thank you for using Central Exchange!</strong></p>
                <p>This receipt serves as proof of your completed transaction.</p>
                <p style="font-size: 12px; margin-top: 20px;">Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sell-receipt-${tradeId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Professional receipt saved as HTML file.",
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
              <span className="font-semibold">₦{Math.round((netAmount || 0) / parseFloat(amount || '1')).toLocaleString()}/{cryptoType}</span>
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
            onClick={() => navigate('/buy-sell')}
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