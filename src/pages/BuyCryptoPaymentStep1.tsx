import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Wallet, AlertCircle } from 'lucide-react';
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
  const [userBankAccounts, setUserBankAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserBankAccounts();
  }, [user]);

  const fetchUserBankAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setUserBankAccounts(data || []);
      
      const defaultAccount = data?.find(account => account.is_default);
      if (defaultAccount) {
        setSelectedAccount(defaultAccount);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

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
    if (!cryptoAmount || !walletAddress || !selectedAccount) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const tradeData = {
        buyer_id: user.id,
        seller_id: selectedMerchant.user_id,
        coin_type: coinType,
        amount: parseFloat(cryptoAmount),
        naira_amount: calculateCashAmount(),
        rate: getMerchantRate(),
        platform_fee_amount: calculatePlatformFee(),
        status: 'pending_merchant_accept',
        trade_type: 'buy',
        payment_method: 'bank_transfer'
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();

      if (error) throw error;

      navigate('/buy-crypto-payment-step2', {
        state: {
          tradeId: data.id,
          coinType,
          cryptoAmount,
          cashAmount: calculateCashAmount(),
          selectedMerchant,
          walletAddress
        }
      });

    } catch (error) {
      console.error('Error creating trade:', error);
      toast({
        title: "Error",
        description: "Failed to send trade request",
        variant: "destructive"
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
            <Button onClick={() => navigate('/buy-crypto')}>
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Buy {coinType} - Step 1</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6">
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
              <span className="font-semibold">₦{getMerchantRate().toLocaleString()}/{coinType}</span>
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

        {/* Bank Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment From Account</CardTitle>
            <p className="text-xs text-muted-foreground">
              Regular users can use 1 account. Premium users can use multiple accounts.
            </p>
          </CardHeader>
          <CardContent>
            {userBankAccounts.length > 0 ? (
              <div className="space-y-2">
                {userBankAccounts.slice(0, 1).map((account) => (
                  <div
                    key={account.id}
                    className="p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.bank_name} • {account.account_number}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">No bank account found</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/payment-methods')}
                >
                  Add Bank Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Summary */}
        {cryptoAmount && walletAddress && selectedAccount && (
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
                <span>₦{calculateCashAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (3%):</span>
                <span>₦{calculatePlatformFee().toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-semibold text-primary">₦{calculateTotalAmount().toLocaleString()}</span>
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
          disabled={!cryptoAmount || !walletAddress || !selectedAccount || loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Sending Request...' : 'Send Trade Request'}
        </Button>
      </div>
    </div>
  );
};

export default BuyCryptoPaymentStep1;