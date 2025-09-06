import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, CheckCircle, Upload, Wallet, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleWalletInput } from '@/components/SimpleWalletInput';

const SellCryptoPaymentStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeId, coinType, cryptoAmount, cashAmount, netAmount, selectedMerchant, selectedAccount } = location.state || {};
  
  const [tradeStatus, setTradeStatus] = useState('searching');
  const [escrowAddress, setEscrowAddress] = useState('');
  const [escrowQRCode, setEscrowQRCode] = useState('');
  const [merchantWalletAddress, setMerchantWalletAddress] = useState('');
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    if (tradeId) {
      monitorTradeStatus();
    }
  }, [tradeId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const monitorTradeStatus = async () => {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error) throw error;

      if (trade.status === 'pending_merchant_accept') {
        setTradeStatus('searching');
        setTimeout(monitorTradeStatus, 3000);
      } else if (trade.status === 'merchant_accepted') {
        setTradeStatus('accepted');
        // Generate escrow address for seller to deposit crypto
        setTimeout(() => {
          setTradeStatus('awaiting_crypto_deposit');
          setEscrowAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'); // Mock escrow address
          setEscrowQRCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='); // Mock QR
        }, 3000);
      } else if (trade.status === 'cancelled') {
        toast({
          title: "Trade Cancelled",
          description: "The merchant declined your trade request",
          variant: "destructive"
        });
        navigate('/sell-crypto');
      }
    } catch (error) {
      console.error('Error monitoring trade:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDepositProof(event.target.files[0]);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!depositProof) {
      toast({
        title: "Upload Required",
        description: "Please upload proof of crypto deposit",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'crypto_deposited',
          payment_proof_url: 'uploaded'
        })
        .eq('id', tradeId);

      if (error) throw error;

      navigate('/sell-crypto-payment-step3', {
        state: { 
          tradeId, 
          coinType, 
          cryptoAmount, 
          netAmount, 
          selectedAccount 
        }
      });
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  const getStatusDisplay = () => {
    switch (tradeStatus) {
      case 'searching':
        return {
          title: "Searching for Merchant",
          description: "Waiting for merchant to accept your trade request...",
          icon: <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        };
      case 'accepted':
        return {
          title: "Merchant Accepted!",
          description: "Setting up secure escrow for your trade...",
          icon: <CheckCircle className="w-8 h-8 text-green-500" />
        };
      case 'awaiting_crypto_deposit':
        return {
          title: "Deposit Your Crypto",
          description: "Send your crypto to the secure escrow address below",
          icon: <Wallet className="w-8 h-8 text-blue-500" />
        };
      default:
        return {
          title: "Processing",
          description: "Please wait...",
          icon: <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Sell {coinType} - Step 2</h1>
        <div className="w-10" />
      </div>

      {/* Timer */}
      <div className="p-4 bg-orange-50 border-b border-orange-200">
        <div className="flex items-center justify-center">
          <Clock className="w-5 h-5 text-orange-600 mr-2" />
          <span className="text-orange-800 font-semibold">
            Time Remaining: {formatTime(countdown)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Display */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">{statusInfo.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{statusInfo.title}</h2>
            <p className="text-muted-foreground">{statusInfo.description}</p>
          </CardContent>
        </Card>

        {/* Escrow Deposit Details */}
        {tradeStatus === 'awaiting_crypto_deposit' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deposit {coinType} to Escrow</CardTitle>
              <p className="text-xs text-muted-foreground">
                Send exactly {cryptoAmount} {coinType} to the address below
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Escrow Address</p>
                    <div className="p-3 bg-white rounded border">
                      <p className="font-mono text-sm break-all">{escrowAddress}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(escrowAddress);
                        toast({ title: "Address copied!" });
                      }}
                    >
                      Copy Address
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">QR Code</p>
                    <div className="flex justify-center">
                      <div className="w-32 h-32 bg-white border rounded p-2">
                        <QrCode className="w-full h-full text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Important:</strong> Send exactly {cryptoAmount} {coinType}. 
                      Any other amount will cause delays.
                    </p>
                  </div>
                </div>
              </div>

              {/* Merchant Wallet Address Input */}
              <div>
                <p className="text-sm font-medium mb-2">Merchant's {coinType} Wallet Address</p>
                <SimpleWalletInput
                  coinType={coinType}
                  value={merchantWalletAddress}
                  onChange={setMerchantWalletAddress}
                  placeholder={`Enter merchant's ${coinType} address for crypto release`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is where the crypto will be sent after payment confirmation
                </p>
              </div>

              {/* Upload Proof */}
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Deposit Proof</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="deposit-proof"
                  />
                  <label htmlFor="deposit-proof" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {depositProof ? depositProof.name : 'Upload transaction screenshot'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleConfirmDeposit}
                  disabled={!depositProof || !merchantWalletAddress}
                  className="w-full"
                  size="lg"
                >
                  Confirm Crypto Deposit
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm">
                    Send Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancel Trade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling:</span>
              <span className="font-semibold">{cryptoAmount} {coinType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You'll Receive:</span>
              <span className="font-semibold text-primary">₦{netAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-semibold">{selectedMerchant?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment To:</span>
              <span className="font-semibold">{selectedAccount?.bank_name}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellCryptoPaymentStep2;