import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Download, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SellCryptoPaymentStep3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeId, coinType, cryptoAmount, netAmount, selectedAccount } = location.state || {};
  
  const [tradeStatus, setTradeStatus] = useState('confirming_deposit');
  const [paymentReference, setPaymentReference] = useState('');

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

      if (trade.status === 'crypto_deposited') {
        setTradeStatus('confirming_deposit');
        // Simulate merchant confirming crypto deposit
        setTimeout(() => {
          setTradeStatus('sending_payment');
          setPaymentReference(`TXN-${Date.now()}`);
          
          // Simulate payment being sent
          setTimeout(async () => {
            setTradeStatus('completed');
            
            // Update trade status in database using RPC function or fallback
            try {
              await supabase.rpc('complete_trade', {
                trade_id_param: tradeId,
                user_id_param: user?.id
              });
            } catch (rpcError) {
              // Fallback to direct update
              console.log('Using fallback method for trade completion');
              await supabase
                .from('trades')
                .update({ 
                  status: 'completed',
                  escrow_status: 'completed',
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', tradeId);
            }
          }, 4000);
        }, 5000);
      }
    } catch (error) {
      console.error('Error monitoring trade:', error);
    }
  };

  const getStatusDisplay = () => {
    switch (tradeStatus) {
      case 'confirming_deposit':
        return {
          title: "Confirming Crypto Deposit",
          description: "Merchant is confirming your crypto deposit in escrow...",
          icon: <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "blue"
        };
      case 'sending_payment':
        return {
          title: "Sending Payment",
          description: `Sending ₦${netAmount?.toLocaleString()} to your bank account...`,
          icon: <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />,
          color: "green"
        };
      case 'completed':
        return {
          title: "Trade Completed!",
          description: `₦${netAmount?.toLocaleString()} has been sent to your account`,
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
      netAmount,
      bankAccount: selectedAccount,
      paymentReference,
      completedAt: new Date().toISOString(),
      status: 'completed'
    };
    
    const receiptText = `
CENTRAL EXCHANGE RECEIPT
========================
Trade ID: ${tradeId}
Type: SELL CRYPTO
Cryptocurrency: ${coinType}
Amount Sold: ${cryptoAmount} ${coinType}
Amount Received: ₦${netAmount?.toLocaleString()}
Bank: ${selectedAccount?.bank_name}
Account: ${selectedAccount?.account_number}
Reference: ${paymentReference}
Completed: ${new Date().toLocaleString()}
Status: Completed
========================
Thank you for using Central Exchange!
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sell-receipt-${tradeId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#EAEAEA] p-4 flex items-center justify-center">
        <h1 className="text-lg font-semibold text-gray-900">Sell {coinType} - Final Step</h1>
      </div>

      <div className="p-4 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">{statusInfo.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{statusInfo.title}</h2>
            <p className="text-muted-foreground mb-6">
              {statusInfo.description.replace('₦', '').replace('₦', '') + (statusInfo.description.includes('₦') || statusInfo.description.includes('₦') ? ' NGN' : '')}
            </p>
            
            {tradeStatus === 'completed' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Sold:</span>
                      <span className="font-semibold">{cryptoAmount} {coinType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Received:</span>
                      <span className="font-semibold text-green-600">{netAmount?.toLocaleString()} NGN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">{selectedAccount?.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-mono text-xs">{paymentReference}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Payment sent to {selectedAccount?.account_number}
                    </p>
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
                    onClick={() => navigate('/payment-methods')}
                    variant="outline"
                    className="w-full"
                  >
                    View Bank Account
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/buy-sell')}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-xl"
                  >
                    Sell More Crypto
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {tradeStatus !== 'confirming_deposit' && (
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
                    <p className="text-xs text-muted-foreground">Merchant accepted your sell request</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Crypto Deposited</p>
                    <p className="text-xs text-muted-foreground">Your crypto was secured in escrow</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Deposit Confirmed</p>
                    <p className="text-xs text-muted-foreground">Merchant confirmed crypto receipt</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {tradeStatus === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Payment Sent</p>
                    <p className="text-xs text-muted-foreground">
                      {tradeStatus === 'completed' 
                        ? 'Money sent to your bank account'
                        : 'Sending payment to your account...'}
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

export default SellCryptoPaymentStep3;