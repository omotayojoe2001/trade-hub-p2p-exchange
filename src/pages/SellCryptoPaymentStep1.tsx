import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SellCryptoPaymentStep1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { coinType, selectedMerchant } = location.state || {};
  
  const [cryptoAmount, setCryptoAmount] = useState('');
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

  const calculateNetAmount = () => {
    return calculateCashAmount() - calculatePlatformFee();
  };

  const handleSendTradeRequest = async () => {
    if (!cryptoAmount || !selectedAccount) {
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
        seller_id: user.id,
        buyer_id: selectedMerchant.user_id,
        coin_type: coinType,
        amount: parseFloat(cryptoAmount),
        naira_amount: calculateCashAmount(),
        rate: getMerchantRate(),
        platform_fee_amount: calculatePlatformFee(),
        net_amount: calculateNetAmount(),
        status: 'pending_merchant_accept',
        trade_type: 'sell',
        payment_method: 'bank_transfer'
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();

      if (error) throw error;

      navigate('/sell-crypto-payment-step2', {
        state: {
          tradeId: data.id,
          coinType,
          cryptoAmount,
          cashAmount: calculateCashAmount(),
          netAmount: calculateNetAmount(),
          selectedMerchant,
          selectedAccount
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

  const handleAccountSelect = (account: any) => {
    setSelectedAccount(account);
  };

  if (!coinType || !selectedMerchant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Missing trade information</p>
            <Button onClick={() => navigate('/sell-crypto')}>
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
        <h1 className="text-lg font-semibold">Sell {coinType} - Step 1</h1>
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
            <CardTitle className="text-sm">Amount to Sell</CardTitle>
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
                <p className="text-sm text-muted-foreground">You'll receive (after fees)</p>
                <p className="text-lg font-semibold">₦{calculateNetAmount().toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receive Payment To</CardTitle>
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
                    onClick={() => handleAccountSelect(account)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.bank_name} • {account.account_number}
                        </p>
                      </div>
                      {selectedAccount?.id === account.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/payment-methods')}
                  className="w-full mt-2"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">No bank account found</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/payment-methods')}
                >
                  Add Your First Bank Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Summary */}
        {cryptoAmount && selectedAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Trade Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling:</span>
                <span className="font-semibold">{cryptoAmount} {coinType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount:</span>
                <span>₦{calculateCashAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (3%):</span>
                <span>₦{calculatePlatformFee().toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">You'll Receive:</span>
                <span className="font-semibold text-primary">₦{calculateNetAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-medium">{selectedMerchant.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment To:</span>
                <span className="font-medium">{selectedAccount?.bank_name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Trade Request Button */}
        <Button
          onClick={handleSendTradeRequest}
          disabled={!cryptoAmount || !selectedAccount || loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Sending Request...' : 'Send Trade Request'}
        </Button>
      </div>
    </div>
  );
};

export default SellCryptoPaymentStep1;