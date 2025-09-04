import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Building2, CheckCircle, Upload, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SellPaymentStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    amount, 
    nairaAmount, 
    selectedMerchant, 
    coinType, 
    activeStep: resumeStep,
    selectedBankAccount 
  } = (location.state as any) || {};

  // State variables
  const [activeStep, setActiveStep] = useState<number>(resumeStep || 1);
  const [cryptoAmount, setCryptoAmount] = useState<string>(amount || '');
  const [selectedBank, setSelectedBank] = useState<any>(selectedBankAccount || null);
  const [userBankAccounts, setUserBankAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeRequestId, setTradeRequestId] = useState<string>('');

  // Fetch user's bank accounts
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
      
      // Auto-select default bank account
      const defaultAccount = data?.find(account => account.is_default);
      if (defaultAccount && !selectedBank) {
        setSelectedBank(defaultAccount);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const calculateNairaValue = () => {
    if (!cryptoAmount || !selectedMerchant) return 0;
    const amount = parseFloat(cryptoAmount);
    const rate = getMerchantRate();
    return amount * rate;
  };

  const getMerchantRate = () => {
    if (!selectedMerchant) return 0;
    
    switch (coinType) {
      case 'BTC':
        return selectedMerchant.btc_rate || 150000000;
      case 'ETH':
        return selectedMerchant.eth_rate || 5000000;
      case 'USDT':
        return selectedMerchant.usdt_rate || 750;
      default:
        return 0;
    }
  };

  const calculatePlatformFee = () => {
    const nairaValue = calculateNairaValue();
    return nairaValue * 0.01; // 1% platform fee
  };

  const calculateNetAmount = () => {
    const nairaValue = calculateNairaValue();
    const platformFee = calculatePlatformFee();
    return nairaValue - platformFee;
  };

  const handleSendTradeRequest = async () => {
    if (!cryptoAmount || !selectedBank || !selectedMerchant) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tradeRequestData = {
        trade_type: 'sell' as const,
        coin_type: coinType as 'BTC' | 'ETH' | 'USDT',
        amount: parseFloat(cryptoAmount),
        naira_amount: calculateNairaValue(),
        rate: getMerchantRate(),
        platform_fee_amount: calculatePlatformFee(),
        net_amount: calculateNetAmount(),
        payment_method: 'bank_transfer',
        selected_merchant_id: selectedMerchant.user_id,
        request_data: {
          selectedMerchant,
          selectedBankAccount: selectedBank,
          coinType,
          step: 2
        },
        notes: `Sell ${cryptoAmount} ${coinType} for ₦${calculateNairaValue().toLocaleString()}`
      };

      const { data, error } = await supabase
        .from('trade_requests')
        .insert(tradeRequestData)
        .select()
        .single();

      if (error) throw error;

      setTradeRequestId(data.id);
      setActiveStep(2);

      toast({
        title: "Trade Request Sent!",
        description: "Your sell request has been sent to the merchant",
      });

    } catch (error) {
      console.error('Error creating trade request:', error);
      toast({
        title: "Error",
        description: "Failed to send trade request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankAccountSelect = (account: any) => {
    setSelectedBank(account);
  };

  const addNewBankAccount = () => {
    navigate('/payment-methods', {
      state: { returnTo: '/sell-payment-status', returnState: location.state }
    });
  };

  if (!selectedMerchant || !coinType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Missing trade information</p>
          <Button onClick={() => navigate('/sell-crypto')}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Sell {coinType}</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Step 1: Enter Amount and Select Bank */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                How much {coinType} do you want to sell?
              </h2>
              <p className="text-gray-600 mb-4">
                Selling to: {selectedMerchant.display_name}
              </p>
            </div>

            {/* Crypto Amount Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {coinType} Amount
              </label>
              <input
                type="number"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                placeholder={`Enter ${coinType} amount`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.00000001"
              />
            </div>

            {/* Bank Account Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Receive Payment To
                </label>
                <button
                  onClick={addNewBankAccount}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Add Bank Account
                </button>
              </div>

              {userBankAccounts.length > 0 ? (
                <div className="space-y-2">
                  {userBankAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleBankAccountSelect(account)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBank?.id === account.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{account.account_name}</p>
                          <p className="text-sm text-gray-600">
                            {account.bank_name} • {account.account_number}
                          </p>
                        </div>
                        {selectedBank?.id === account.id && (
                          <CheckCircle size={20} className="text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <Building2 size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">No bank accounts found</p>
                  <Button onClick={addNewBankAccount} variant="outline">
                    Add Your First Bank Account
                  </Button>
                </div>
              )}
            </div>

            {/* Trade Summary */}
            {cryptoAmount && selectedBank && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Trade Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">You're selling:</span>
                    <span className="font-medium">{cryptoAmount} {coinType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange rate:</span>
                    <span className="font-medium">₦{getMerchantRate().toLocaleString()}/{coinType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross amount:</span>
                    <span className="font-medium">₦{calculateNairaValue().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform fee (1%):</span>
                    <span className="font-medium">₦{calculatePlatformFee().toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium text-gray-900">You'll receive:</span>
                    <span className="font-semibold text-green-600">₦{calculateNetAmount().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSendTradeRequest}
              disabled={!cryptoAmount || !selectedBank || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {isSubmitting ? 'Sending Request...' : 'Send Sell Request'}
            </Button>
          </div>
        )}

        {/* Step 2: Waiting for Merchant */}
        {activeStep === 2 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sell Request Sent!
            </h2>
            <p className="text-gray-600 mb-6">
              Waiting for {selectedMerchant.display_name} to accept your sell request.
              You'll be notified once they respond.
            </p>
            <Button
              onClick={() => navigate('/my-trades')}
              variant="outline"
              className="mr-3"
            >
              View My Trades
            </Button>
            <Button onClick={() => navigate('/home')}>
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellPaymentStatus;
