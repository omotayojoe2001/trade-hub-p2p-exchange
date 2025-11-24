import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Wallet, AlertCircle, Crown } from 'lucide-react';
import { SimpleWalletInput } from '@/components/SimpleWalletInput';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


const BuyCryptoPaymentStep1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { coinType, selectedMerchant } = location.state || {};
  
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  // Removed bank account logic - not needed for Buy Crypto
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Navigation confirmation for active trade
  useEffect(() => {
    if (cryptoAmount || walletAddress) {
      setHasUnsavedChanges(true);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have an active trade request. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cryptoAmount, walletAddress, hasUnsavedChanges]);

  const getMerchantRate = () => {
    if (!selectedMerchant) return 0;
    
    switch (coinType) {
      case 'BTC':
        return selectedMerchant.btc_rate || 150000000;
      case 'ETH':
        return selectedMerchant.eth_rate || 5000000;
      case 'USDT':
        return selectedMerchant.usdt_rate || 1650;
      default:
        return 0;
    }
  };

  const calculateCashAmount = () => {
    if (!cryptoAmount) return 0;
    return parseFloat(cryptoAmount) * getMerchantRate();
  };

  const calculatePlatformFee = () => {
    return calculateCashAmount() * 0.03; // 3% platform fee
  };

  const calculateTotalAmount = () => {
    return calculateCashAmount() + calculatePlatformFee();
  };

  const handleSendTradeRequest = async () => {
    if (!cryptoAmount || !walletAddress || !user || !selectedMerchant) {
      toast({
        title: "Missing Information",
        description: "Please enter crypto amount and wallet address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate rate and naira amount
      const rate = getMerchantRate();
      const nairaAmount = parseFloat(cryptoAmount) * rate;

      // Create trade request for buy crypto flow with 10-minute expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      const { data: tradeRequest, error: tradeError } = await supabase
        .from('trade_requests')
        .insert({
          user_id: user.id,
          merchant_id: selectedMerchant.user_id,
          trade_type: 'buy',
          crypto_type: coinType,
          amount_crypto: parseFloat(cryptoAmount),
          amount_fiat: nairaAmount,
          rate: rate,
          payment_method: 'bank_transfer',
          status: 'open',
          wallet_address: walletAddress,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Notify merchant about the trade request
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedMerchant.user_id,
          type: 'trade_request',
          title: 'New Buy Crypto Request',
          message: `${user.user_metadata?.display_name || user.email || 'A user'} wants to buy ${cryptoAmount} ${coinType} for NGN ${nairaAmount.toLocaleString()}`,
          data: {
            trade_request_id: tradeRequest.id,
            trade_type: 'buy',
            crypto_type: coinType,
            amount_crypto: parseFloat(cryptoAmount),
            amount_fiat: nairaAmount
          }
        });

      toast({
        title: "Trade Request Sent!",
        description: `Your trade request for ${cryptoAmount} ${coinType} has been sent to ${selectedMerchant.display_name}. They have 10 minutes to respond.`,
      });

      // Navigate to step 2 with trade details
      navigate('/buy-crypto-payment-step2', {
        state: {
          tradeRequestId: tradeRequest.id,
          coinType,
          selectedMerchant,
          cryptoAmount,
          walletAddress,
          nairaAmount,
          rate,

        }
      });

    } catch (error: any) {
      console.error('Error sending trade request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send trade request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!coinType || !selectedMerchant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Missing trade information</p>
            <Button onClick={() => navigate('/buy-sell')}>
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Poppins'] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#EAEAEA] p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => {
          if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have an active trade request. Are you sure you want to cancel?');
            if (confirmed) {
              // Go back to merchant list or auto-match depending on how user got here
              navigate('/merchant-list', { state: location.state });
            }
          } else {
            navigate('/merchant-list', { state: location.state });
          }
        }} className="hover:bg-white/80">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Buy {coinType}</h1>
          <p className="text-xs text-muted-foreground">Step 1 of 3</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6 pb-6">
        {/* Selected Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cryptocurrency:</span>
              <span className="font-semibold">{coinType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-semibold">{selectedMerchant.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-semibold">NGN {getMerchantRate().toLocaleString()}/{coinType}</span>
            </div>
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Amount to Buy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="crypto-amount">Amount ({coinType})</Label>
              <Input
                id="crypto-amount"
                type="number"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                placeholder={`Enter ${coinType} amount`}
                step="0.00000001"
              />
            </div>
            
            {cryptoAmount && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">You'll pay</p>
                <p className="text-lg font-semibold">NGN {calculateCashAmount().toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet Address to Receive {coinType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleWalletInput
              coinType={coinType}
              value={walletAddress}
              onChange={setWalletAddress}
              placeholder={`Enter your ${coinType} wallet address`}
            />
          </CardContent>
        </Card>

        {/* This section removed - not needed for Buy Crypto */}

        {/* Trade Summary */}
        {cryptoAmount && walletAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Trade Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto Amount:</span>
                <span className="font-semibold">{cryptoAmount} {coinType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Amount:</span>
                <span>NGN {calculateCashAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (3%):</span>
                <span>NGN {calculatePlatformFee().toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-semibold text-primary">NGN {calculateTotalAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-medium">{selectedMerchant.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Network:</span>
                <span className="font-medium">{coinType} Mainnet</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Trade Request Button */}
        <Button
          onClick={handleSendTradeRequest}
          disabled={!cryptoAmount || !walletAddress || loading}
          className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white font-semibold py-4 text-base rounded-xl"
          size="lg"
        >
          {loading ? 'Sending Request...' : 'Send Trade Request'}
        </Button>
      </div>

    </div>
  );
};

export default BuyCryptoPaymentStep1;