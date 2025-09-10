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

  useEffect(() => {
    if (tradeId) {
      monitorTradeCompletion();
    }
  }, [tradeId]);

  const monitorTradeCompletion = async () => {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error) throw error;

      if (trade.status === 'payment_sent') {
        setTradeStatus('confirming_payment');
        // Simulate merchant confirming payment
        setTimeout(() => {
          setTradeStatus('releasing_crypto');
          // Simulate crypto release
          setTimeout(() => {
            setTradeStatus('completed');
            setTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
            
            // Update trade status in database
            supabase
              .from('trades')
              .update({ 
                status: 'completed',
                transaction_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                completed_at: new Date().toISOString()
              })
              .eq('id', tradeId);
          }, 3000);
        }, 5000);
      }
    } catch (error) {
      console.error('Error monitoring trade:', error);
    }
  };

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
    const receiptData = {
      tradeId,
      coinType,
      amount: cryptoAmount,
      walletAddress,
      txHash,
      completedAt: new Date().toISOString(),
      status: 'completed'
    };
    
    const receiptText = `
CENTRAL EXCHANGE RECEIPT
========================
Trade ID: ${tradeId}
Cryptocurrency: ${coinType}
Amount: ${cryptoAmount} ${coinType}
Wallet Address: ${walletAddress}
Transaction Hash: ${txHash}
Completed: ${new Date().toLocaleString()}
Status: Completed
========================
Thank you for using Central Exchange!
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${tradeId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">{cryptoAmount} {coinType}</span>
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
                    onClick={() => navigate('/crypto-wallet')}
                    className="w-full"
                  >
                    View Wallet
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