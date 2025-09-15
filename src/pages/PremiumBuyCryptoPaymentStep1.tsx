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
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumBuyCryptoPaymentStep1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { coinType, selectedMerchant } = location.state || {};
  
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (cryptoAmount || walletAddress) {
      setHasUnsavedChanges(true);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have an active premium trade request. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cryptoAmount, walletAddress, hasUnsavedChanges]);

  const getMerchantRate = () => {
    if (!selectedMerchant) return 0;
    
    switch (coinType) {
      case 'BTC':
        return (selectedMerchant.btc_rate || 150000000) * 1.02; // Premium rate bonus
      case 'ETH':
        return (selectedMerchant.eth_rate || 5000000) * 1.02;
      case 'USDT':
        return (selectedMerchant.usdt_rate || 1650) * 1.02;
      default:
        return 0;
    }
  };

  const calculateCashAmount = () => {
    if (!cryptoAmount) return 0;
    return parseFloat(cryptoAmount) * getMerchantRate();
  };

  const calculatePlatformFee = () => {
    return calculateCashAmount() * 0.025; // 2.5% premium fee (lower than regular 3%)
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
      const rate = getMerchantRate();
      const nairaAmount = parseFloat(cryptoAmount) * rate;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for premium
      
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

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedMerchant.user_id,
          type: 'premium_trade_request',
          title: 'New Buy Crypto Request',
          message: `${user.user_metadata?.display_name || user.email || 'A user'} wants to buy ${cryptoAmount} ${coinType} for ₦${nairaAmount.toLocaleString()}`,
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
        description: `Your trade request for ${cryptoAmount} ${coinType} has been sent to ${selectedMerchant.display_name}. They have 15 minutes to respond.`,
      });

      navigate('/premium-buy-crypto-payment-step2', {
        state: {
          tradeRequestId: tradeRequest.id,
          coinType,
          selectedMerchant,
          cryptoAmount,
          walletAddress,
          nairaAmount,
          rate
        }
      });

    } catch (error: any) {
      console.error('Error sending premium trade request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send premium trade request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!coinType || !selectedMerchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Missing premium trade information</p>
            <Button onClick={() => navigate('/premium-trade')} className="bg-gradient-to-r from-yellow-600 to-yellow-700">
              <Crown size={16} className="mr-2" />
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-sm bg-background/95 border-b p-4 flex items-center justify-between shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => {
          if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have an active premium trade request. Are you sure you want to cancel?');
            if (confirmed) {
              navigate('/premium-merchant-list', { state: location.state });
            }
          } else {
            navigate('/premium-merchant-list', { state: location.state });
          }
        }} className="hover:bg-white/80">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Crown size={16} className="text-muted-foreground" />
            <h1 className="text-lg font-bold">Premium Buy {coinType}</h1>
          </div>
          <p className="text-xs text-muted-foreground">Premium Trading - Step 1 of 3</p>
        </div>
        <div className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center">
          <Crown size={10} className="mr-1" />
          Premium
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Selected Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Crown size={16} className="mr-2 text-muted-foreground" />
              Premium Trade Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cryptocurrency:</span>
              <span className="font-semibold">{coinType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Premium Merchant:</span>
              <span className="font-semibold">{selectedMerchant.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Premium Rate:</span>
              <span className="font-semibold">₦{getMerchantRate().toLocaleString()}/{coinType}</span>
            </div>
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Crown size={16} className="mr-2 text-muted-foreground" />
              Amount to Buy
            </CardTitle>
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
                className=""
              />
            </div>
            
            {cryptoAmount && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">You'll pay (Premium Rate)</p>
                <p className="text-lg font-semibold">₦{calculateCashAmount().toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <Crown size={14} className="text-muted-foreground" />
              Premium Wallet Address to Receive {coinType}
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

        {/* Trade Summary */}
        {cryptoAmount && walletAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Crown size={16} className="mr-2 text-muted-foreground" />
                Premium Trade Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto Amount:</span>
                <span className="font-semibold">{cryptoAmount} {coinType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Amount:</span>
                <span>₦{calculateCashAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Premium Fee (2.5%):</span>
                <span>₦{calculatePlatformFee().toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-semibold text-primary">₦{calculateTotalAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Premium Merchant:</span>
                <span className="font-medium">{selectedMerchant.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">{coinType} Mainnet</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Trade Request Button */}
        <Button
          onClick={handleSendTradeRequest}
          disabled={!cryptoAmount || !walletAddress || loading}
          className="w-full font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          <Crown size={16} className="mr-2" />
          {loading ? 'Sending Request...' : 'Send Premium Trade Request'}
        </Button>
      </div>
      
      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumBuyCryptoPaymentStep1;