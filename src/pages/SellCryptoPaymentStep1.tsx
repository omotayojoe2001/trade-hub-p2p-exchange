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
import { cryptoPriceService } from '@/services/cryptoPriceService';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [liveRate, setLiveRate] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);


  useEffect(() => {
    fetchUserBankAccounts();
    fetchLiveRate();
  }, [user, coinType]);

  const fetchLiveRate = async () => {
    try {
      const ngnPrice = await cryptoPriceService.getPriceInNgn(coinType as any);
      setLiveRate(ngnPrice);
    } catch (error) {
      console.error('Error fetching live rate:', error);
      setLiveRate(0); // No fallback - show error if API fails
    }
  };

  // Navigation confirmation for active trade
  useEffect(() => {
    if (cryptoAmount || selectedAccount) {
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
  }, [cryptoAmount, selectedAccount, hasUnsavedChanges]);

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
    if (!selectedMerchant) return liveRate;
    
    // Use merchant's custom rate if available, otherwise use live rate
    switch (coinType) {
      case 'BTC':
        return selectedMerchant.btc_rate || liveRate;
      case 'ETH':
        return selectedMerchant.eth_rate || liveRate;
      case 'USDT':
        return selectedMerchant.usdt_rate || liveRate;
      case 'ETH':
        return selectedMerchant.eth_rate || liveRate;
      case 'BNB':
        return selectedMerchant.bnb_rate || liveRate;
      case 'XRP':
        return selectedMerchant.xrp_rate || liveRate;
      case 'POLYGON':
        return selectedMerchant.polygon_rate || liveRate;
      default:
        return liveRate;
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

  const handleContinueToEscrow = () => {
    if (!cryptoAmount || !selectedAccount) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Just navigate to step 2 - no trade request sent yet
    navigate('/sell-crypto-payment-step2', {
      state: {
        coinType,
        cryptoAmount,
        cashAmount: calculateCashAmount(),
        netAmount: calculateNetAmount(),
        selectedMerchant,
        selectedAccount
      }
    });
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
            <Button onClick={() => navigate('/premium-trade')}>
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#EAEAEA] p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => {
          if (hasUnsavedChanges) {
            setShowConfirmDialog(true);
          } else {
            navigate(-1);
          }
        }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Sell {coinType}</h1>
          <p className="text-xs text-muted-foreground">Step 1 of 3 - Trade Setup</p>
        </div>
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
              <span className="font-semibold">{getMerchantRate().toLocaleString()} NGN/{coinType}</span>
            </div>
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How Much {coinType} Do You Want to Sell?</CardTitle>
            <p className="text-xs text-muted-foreground">
              Enter the amount of {coinType} you want to convert to Naira.
            </p>
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
                <p className="text-lg font-semibold">{calculateNetAmount().toLocaleString()} NGN</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Where Should Merchant Send Your Cash?</CardTitle>
            <p className="text-xs text-muted-foreground">
              Select the bank account where you want to receive your Naira payment.
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
                  onClick={() => {
                    // Store current state for return navigation
                    sessionStorage.setItem('sellCryptoState', JSON.stringify({
                      coinType,
                      selectedMerchant,
                      cryptoAmount,
                      returnPath: '/sell-crypto-payment-step1'
                    }));
                    navigate('/payment-methods');
                  }}
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
                  onClick={() => {
                    // Store current state for return navigation
                    sessionStorage.setItem('sellCryptoState', JSON.stringify({
                      coinType,
                      selectedMerchant,
                      cryptoAmount,
                      returnPath: '/sell-crypto-payment-step1'
                    }));
                    navigate('/payment-methods');
                  }}
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
                <span>{calculateCashAmount().toLocaleString()} NGN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (3%):</span>
                <span>{calculatePlatformFee().toLocaleString()} NGN</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">You'll Receive:</span>
                <span className="font-semibold text-primary">{calculateNetAmount().toLocaleString()} NGN</span>
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

        {/* Continue Button */}
        <Button
          onClick={handleContinueToEscrow}
          disabled={!cryptoAmount || !selectedAccount}
          className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white font-semibold py-4 text-base rounded-xl"
          size="lg"
        >
          Continue to Escrow
        </Button>
        
        {/* Information Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <AlertCircle size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-blue-800 text-sm font-medium mb-1">
                Next: Send Crypto to Escrow
              </p>
              <p className="text-blue-700 text-xs">
                You'll get a secure Fireblocks address to send your {coinType}. Only after your crypto is confirmed will the merchant be notified to send cash.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirmText="Yes, Go Back"
        cancelText="Stay Here"
        variant="destructive"
        onConfirm={() => {
          setShowConfirmDialog(false);
          navigate(-1);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};

export default SellCryptoPaymentStep1;