import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BuyCryptoPaymentStep3 = () => {
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
      console.log('Monitoring trade completion for tradeId:', tradeId);
      
      // Try multiple ways to find the trade
      let trade = null;
      
      // First try by trade ID directly
      const { data: tradeById } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .maybeSingle();
        
      if (tradeById) {
        trade = tradeById;
      } else {
        // Try by trade_request_id
        const { data: tradeByRequestId } = await supabase
          .from('trades')
          .select('*')
          .eq('trade_request_id', tradeId)
          .maybeSingle();
        trade = tradeByRequestId;
      }
      
      console.log('Found trade:', trade);

      if (trade) {
        setTradeData(trade); // Store full trade data
        if (trade.status === 'payment_sent' || trade.escrow_status === 'payment_proof_uploaded') {
          setTradeStatus('confirming_payment');
        } else if (trade.status === 'completed') {
          console.log('Trade completed, updating UI');
          setTradeStatus('completed');
          setTxHash(trade.transaction_hash || trade.payment_hash || 'completed');
        } else if (trade.escrow_status === 'crypto_received') {
          setTradeStatus('confirming_payment');
        }
      } else {
        console.log('No trade found for ID:', tradeId);
      }
    } catch (error) {
      console.error('Error monitoring trade:', error);
    }
  };
  
  // Poll for status updates every 5 seconds
  useEffect(() => {
    if (tradeId && tradeStatus === 'confirming_payment') {
      const interval = setInterval(monitorTradeCompletion, 5000);
      return () => clearInterval(interval);
    }
  }, [tradeId, tradeStatus, monitorTradeCompletion]);

  const getStatusDisplay = () => {
    switch (tradeStatus) {
      case 'confirming_payment':
        return {
          title: "Confirming Payment",
          description: "Merchant is confirming your payment...",
          icon: <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "blue"
        };
      case 'releasing_crypto':
        return {
          title: "Releasing Crypto",
          description: `Releasing ${cryptoAmount} ${coinType} from escrow to your wallet...`,
          icon: <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "green"
        };
      case 'completed':
        return {
          title: "Trade Completed!",
          description: `${cryptoAmount} ${coinType} has been sent to your wallet`,
          icon: <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />,
          color: "green"
        };
      default:
        return {
          title: "Processing",
          description: "Please wait...",
          icon: <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "blue"
        };
    }
  };

  const generateReceipt = () => {
    if (!tradeData) {
      toast({
        title: "Error",
        description: "Trade data not available for receipt",
        variant: "destructive"
      });
      return;
    }
    
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Trade Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; }
            .success { color: #22c55e; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Trade Receipt</h1>
            <p>Central Exchange P2P Platform</p>
        </div>
        
        <div class="row">
            <span class="label">Trade ID:</span>
            <span>${tradeData.id}</span>
        </div>
        
        <div class="row">
            <span class="label">Amount:</span>
            <span>${tradeData.amount_crypto} ${tradeData.crypto_type}</span>
        </div>
        
        <div class="row">
            <span class="label">Rate:</span>
            <span>₦${(tradeData.naira_amount / tradeData.amount_crypto).toLocaleString()}</span>
        </div>
        
        <div class="row">
            <span class="label">Total Paid:</span>
            <span>₦${tradeData.naira_amount?.toLocaleString()}</span>
        </div>
        
        <div class="row">
            <span class="label">Platform Fee:</span>
            <span>₦${tradeData.platform_fee_amount || 0}</span>
        </div>
        
        <div class="row">
            <span class="label">Wallet Address:</span>
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
            <span class="success">Completed</span>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666;">
            <p>Thank you for using Central Exchange!</p>
        </div>
    </body>
    </html>
    `;
    
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${tradeData.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Receipt Downloaded",
      description: "Receipt saved as HTML file"
    });
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-center">
        <h1 className="text-lg font-semibold">Buy {coinType} - Final Step</h1>
      </div>

      <div className="p-4 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">{statusInfo.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{statusInfo.title}</h2>
            <p className="text-muted-foreground mb-6">
              {statusInfo.description}
            </p>
            
            {tradeStatus === 'completed' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trade ID:</span>
                      <span className="font-mono text-xs">{tradeData?.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">{tradeData?.amount_crypto} {tradeData?.crypto_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-semibold">₦{tradeData?.naira_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-semibold">₦{tradeData ? (tradeData.naira_amount / tradeData.amount_crypto).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wallet:</span>
                      <span className="font-mono text-xs">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tx Hash:</span>
                      <span className="font-mono text-xs">{txHash?.slice(0, 10)}...{txHash?.slice(-10)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={generateReceipt}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/trade-completed', {
                      state: {
                        tradeId: tradeData?.id || tradeId,
                        date: tradeData?.created_at ? new Date(tradeData.created_at).toLocaleString() : new Date().toLocaleString(),
                        amountSold: `${tradeData?.amount_crypto || cryptoAmount}`,
                        coin: tradeData?.crypto_type || coinType,
                        rate: tradeData ? `₦${Math.round(tradeData.naira_amount / tradeData.amount_crypto).toLocaleString()}/${tradeData.crypto_type}` : 'N/A',
                        totalReceived: tradeData ? `₦${tradeData.naira_amount?.toLocaleString()}` : 'N/A',
                        platformFee: tradeData ? `₦${(tradeData.platform_fee_amount || Math.round(tradeData.naira_amount * 0.005)).toLocaleString()}` : 'N/A',
                        netAmount: tradeData ? `₦${Math.round((tradeData.naira_amount || 0) * 0.995).toLocaleString()}` : 'N/A',
                        merchant: 'Platform Purchase',
                        bankAccount: 'Direct Purchase',
                        status: 'completed'
                      }
                    })}
                    className="w-full"
                  >
                    View Receipt
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/buy-sell')}
                    className="w-full"
                  >
                    Buy More Crypto
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {tradeStatus !== 'confirming_payment' && (
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transaction Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Trade Request Sent</p>
                    <p className="text-xs text-muted-foreground">Merchant accepted your request</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Escrow Funded</p>
                    <p className="text-xs text-muted-foreground">Crypto deposited to secure escrow</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Payment Sent</p>
                    <p className="text-xs text-muted-foreground">Your payment was confirmed</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {tradeStatus === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Crypto Released</p>
                    <p className="text-xs text-muted-foreground">
                      {tradeStatus === 'completed' 
                        ? 'Crypto sent to your wallet'
                        : 'Releasing crypto from escrow...'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BuyCryptoPaymentStep3;