import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Download, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumBuyCryptoPaymentStep3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeId, coinType, cryptoAmount, walletAddress } = location.state || {};
  
  const [tradeStatus, setTradeStatus] = useState('confirming_payment');
  const [txHash, setTxHash] = useState('');
  const [tradeData, setTradeData] = useState(null);

  useEffect(() => {
    if (tradeId) {
      monitorTradeCompletion();
    }
  }, [tradeId]);

  const monitorTradeCompletion = async () => {
    try {
      let trade = null;
      
      const { data: tradeById } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .maybeSingle();
        
      if (tradeById) {
        trade = tradeById;
      } else {
        const { data: tradeByRequestId } = await supabase
          .from('trades')
          .select('*')
          .eq('trade_request_id', tradeId)
          .maybeSingle();
        trade = tradeByRequestId;
      }

      if (trade) {
        setTradeData(trade);
        if (trade.status === 'payment_sent') {
          setTradeStatus('confirming_payment');
        } else if (trade.status === 'completed') {
          setTradeStatus('completed');
          setTxHash(trade.transaction_hash || 'premium-completed');
        }
      }
    } catch (error) {
      console.error('Error monitoring premium trade:', error);
    }
  };
  
  useEffect(() => {
    if (tradeId && tradeStatus === 'confirming_payment') {
      const interval = setInterval(monitorTradeCompletion, 3000); // Faster for premium
      return () => clearInterval(interval);
    }
  }, [tradeId, tradeStatus]);

  const getStatusDisplay = () => {
    switch (tradeStatus) {
      case 'confirming_payment':
        return {
          title: "Confirming Premium Payment",
          description: "Premium merchant is confirming your payment...",
          icon: <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "yellow"
        };
      case 'releasing_crypto':
        return {
          title: "Releasing Premium Crypto",
          description: `Releasing ${cryptoAmount} ${coinType} from premium escrow to your wallet...`,
          icon: <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "green"
        };
      case 'completed':
        return {
          title: "Premium Trade Completed!",
          description: `${cryptoAmount} ${coinType} has been sent to your premium wallet`,
          icon: <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />,
          color: "green"
        };
      default:
        return {
          title: "Processing Premium Trade",
          description: "Please wait...",
          icon: <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "yellow"
        };
    }
  };

  const generateReceipt = () => {
    if (!tradeData) {
      toast({
        title: "Error",
        description: "Premium trade data not available for receipt",
        variant: "destructive"
      });
      return;
    }
    
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Premium Trade Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fed7aa); }
            .header { text-align: center; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 20px; background: white; padding: 20px; border-radius: 10px; }
            .premium-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; display: inline-block; margin-top: 10px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #fbbf24; }
            .label { font-weight: bold; color: #92400e; }
            .success { color: #059669; font-weight: bold; }
            .premium-highlight { background: linear-gradient(135deg, #fef3c7, #fed7aa); padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="color: #92400e;">🏆 Premium Trade Receipt</h1>
            <p>Central Exchange P2P Premium Platform</p>
            <div class="premium-badge">👑 PREMIUM MEMBER</div>
        </div>
        
        <div class="premium-highlight">
            <div class="row">
                <span class="label">Premium Trade ID:</span>
                <span>${tradeData.id}</span>
            </div>
        </div>
        
        <div class="row">
            <span class="label">Amount:</span>
            <span>${tradeData.amount_crypto} ${tradeData.crypto_type}</span>
        </div>
        
        <div class="row">
            <span class="label">Premium Rate:</span>
            <span>₦${(tradeData.naira_amount / tradeData.amount_crypto).toLocaleString()}</span>
        </div>
        
        <div class="row">
            <span class="label">Total Paid:</span>
            <span>₦${tradeData.naira_amount?.toLocaleString()}</span>
        </div>
        
        <div class="row">
            <span class="label">Premium Fee (2.5%):</span>
            <span>₦${tradeData.platform_fee_amount || Math.round(tradeData.naira_amount * 0.025)}</span>
        </div>
        
        <div class="row">
            <span class="label">Premium Wallet:</span>
            <span style="font-family: monospace; font-size: 12px;">${walletAddress || 'N/A'}</span>
        </div>
        
        <div class="row">
            <span class="label">Transaction Hash:</span>
            <span style="font-family: monospace; font-size: 12px;">${txHash || 'Pending'}</span>
        </div>
        
        <div class="row">
            <span class="label">Date:</span>
            <span>${new Date(tradeData.created_at).toLocaleString()}</span>
        </div>
        
        <div class="row">
            <span class="label">Status:</span>
            <span class="success">✅ PREMIUM COMPLETED</span>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #92400e;">
            <p><strong>🏆 Thank you for using Central Exchange Premium!</strong></p>
            <p style="font-size: 12px;">Premium members enjoy exclusive rates and priority support</p>
        </div>
    </body>
    </html>
    `;
    
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `premium-receipt-${tradeData.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Premium Receipt Downloaded",
      description: "Premium receipt saved as HTML file"
    });
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-yellow-200 p-4 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Crown size={18} className="text-yellow-600" />
          <h1 className="text-lg font-semibold text-yellow-900">Premium Buy {coinType} - Final Step</h1>
          <Crown size={18} className="text-yellow-600" />
        </div>
      </div>

      <div className="p-4 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md bg-white/90 border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="mb-6">{statusInfo.icon}</div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown size={20} className="text-yellow-600" />
              <h2 className="text-xl font-semibold text-yellow-900">{statusInfo.title}</h2>
            </div>
            <p className="text-yellow-700 mb-6">
              {statusInfo.description}
            </p>
            
            {tradeStatus === 'completed' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg border border-green-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Premium Trade ID:</span>
                      <span className="font-mono text-xs text-yellow-900">{tradeData?.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Amount:</span>
                      <span className="font-semibold text-yellow-900">{tradeData?.amount_crypto} {tradeData?.crypto_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Total Paid:</span>
                      <span className="font-semibold text-yellow-900">₦{tradeData?.naira_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Premium Rate:</span>
                      <span className="font-semibold text-yellow-900">₦{tradeData ? (tradeData.naira_amount / tradeData.amount_crypto).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Premium Wallet:</span>
                      <span className="font-mono text-xs text-yellow-900">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Tx Hash:</span>
                      <span className="font-mono text-xs text-yellow-900">{txHash?.slice(0, 10)}...{txHash?.slice(-10)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={generateReceipt}
                    variant="outline"
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <Crown size={14} className="mr-1" />
                    Download Premium Receipt
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/premium-trade-completed', {
                      state: {
                        tradeId: tradeData?.id || tradeId,
                        date: tradeData?.created_at ? new Date(tradeData.created_at).toLocaleString() : new Date().toLocaleString(),
                        amountSold: `${tradeData?.amount_crypto || cryptoAmount}`,
                        coin: tradeData?.crypto_type || coinType,
                        rate: tradeData ? `₦${Math.round(tradeData.naira_amount / tradeData.amount_crypto).toLocaleString()}/${tradeData.crypto_type}` : 'N/A',
                        totalReceived: tradeData ? `₦${tradeData.naira_amount?.toLocaleString()}` : 'N/A',
                        platformFee: tradeData ? `₦${(tradeData.platform_fee_amount || Math.round(tradeData.naira_amount * 0.025)).toLocaleString()}` : 'N/A',
                        netAmount: tradeData ? `₦${Math.round((tradeData.naira_amount || 0) * 0.975).toLocaleString()}` : 'N/A',
                        merchant: 'Premium Purchase',
                        bankAccount: 'Premium Direct Purchase',
                        status: 'completed',
                        isPremium: true
                      }
                    })}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
                  >
                    <Crown size={16} className="mr-2" />
                    View Premium Receipt
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/premium-trade')}
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Crown size={16} className="mr-2" />
                    Buy More Premium Crypto
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Premium Timeline */}
      {tradeStatus !== 'confirming_payment' && (
        <div className="p-4">
          <Card className="bg-white/90 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Crown size={16} className="mr-2 text-yellow-600" />
                Premium Transaction Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Premium Trade Request Sent</p>
                    <p className="text-xs text-yellow-700">Premium merchant accepted your request</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Premium Escrow Funded</p>
                    <p className="text-xs text-yellow-700">Crypto deposited to premium secure escrow</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Premium Payment Sent</p>
                    <p className="text-xs text-yellow-700">Your premium payment was confirmed</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {tradeStatus === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Premium Crypto Released</p>
                    <p className="text-xs text-yellow-700">
                      {tradeStatus === 'completed' 
                        ? 'Premium crypto sent to your wallet'
                        : 'Releasing premium crypto from escrow...'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumBuyCryptoPaymentStep3;