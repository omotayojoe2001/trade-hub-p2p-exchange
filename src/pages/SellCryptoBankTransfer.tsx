import React, { useState } from 'react';
import { ArrowLeft, Crown, TrendingDown, Star, Building2, User, ChevronRight, Shield, Clock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import BottomNavigation from '@/components/BottomNavigation';

const SellCryptoBankTransfer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const [searchParams] = useSearchParams();
  const preselectedCoin = searchParams.get('coin');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cryptocurrency: preselectedCoin || '',
    cryptoAmount: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      sortCode: ''
    },
    selectedBuyer: null as any
  });

  const cryptocurrencies = [
    { value: 'BTC', label: 'Bitcoin', symbol: '₿', rate: 150234500, icon: '₿' },
    { value: 'ETH', label: 'Ethereum', symbol: 'Ξ', rate: 5358309, icon: 'Ξ' },
    { value: 'USDT', label: 'Tether', symbol: '₮', rate: 1550, icon: '₮' },
    { value: 'BNB', label: 'BNB', symbol: 'B', rate: 1073298, icon: 'B' },
    { value: 'SOL', label: 'Solana', symbol: '◎', rate: 380789, icon: '◎' },
    { value: 'ADA', label: 'Cardano', symbol: '₳', rate: 1907, icon: '₳' }
  ];

  const buyers = [
    {
      id: '1',
      name: 'NairaBuyer',
      rating: 4.9,
      trades: 1547,
      rate: 150234500,
      maxPurchase: '5.0 BTC',
      paymentMethods: ['Bank Transfer', 'Mobile Money'],
      responseTime: '1 min',
      isPremium: true,
      online: true
    },
    {
      id: '2',
      name: 'CashMaster',
      rating: 4.8,
      trades: 1092,
      rate: 150240000,
      maxPurchase: '3.5 BTC',
      paymentMethods: ['Bank Transfer'],
      responseTime: '3 mins',
      isPremium: true,
      online: true
    },
    {
      id: '3',
      name: 'QuickPay',
      rating: 4.7,
      trades: 834,
      rate: 150245000,
      maxPurchase: '2.0 BTC',
      paymentMethods: ['Bank Transfer', 'Mobile Money'],
      responseTime: '5 mins',
      isPremium: false,
      online: true
    }
  ];

  const getSelectedCrypto = () => {
    return cryptocurrencies.find(crypto => crypto.value === formData.cryptocurrency);
  };

  const calculateNairaAmount = () => {
    const selectedCrypto = getSelectedCrypto();
    if (!selectedCrypto || !formData.cryptoAmount) return '0';
    
    const cryptoAmount = parseFloat(formData.cryptoAmount);
    const nairaAmount = cryptoAmount * selectedCrypto.rate;
    return nairaAmount.toLocaleString();
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('bankDetails.')) {
      const bankField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSelectBuyer = (buyer: any) => {
    setFormData(prev => ({
      ...prev,
      selectedBuyer: buyer
    }));
    setStep(3);
  };

  const handleConfirmTrade = () => {
    toast({
      title: isPremium ? "Premium Sell Order Created" : "Sell Order Created",
      description: `Your ${formData.cryptocurrency} sell order has been created with ${formData.selectedBuyer.name}`,
    });
    
    // Navigate to payment status
    navigate(isPremium ? '/premium-payment-status' : '/payment-status', {
      state: {
        amount: formData.cryptoAmount,
        nairaAmount: calculateNairaAmount(),
        cryptocurrency: formData.cryptocurrency,
        buyer: formData.selectedBuyer,
        bankDetails: formData.bankDetails,
        type: 'sell',
        step: 1
      }
    });
  };

  const isStep1Valid = () => {
    return formData.cryptocurrency && 
           formData.cryptoAmount && 
           formData.bankDetails.accountName && 
           formData.bankDetails.accountNumber && 
           formData.bankDetails.bankName;
  };

  return (
    <div className={`min-h-screen ${isPremium ? 'bg-gray-50' : 'bg-white'} pb-20`}>
      {/* Header */}
      <div className={`${isPremium ? 'bg-white border-b border-gray-200' : 'bg-blue-600'} px-4 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/sell-for-cash" className="mr-4">
              <ArrowLeft size={24} className={isPremium ? 'text-gray-600' : 'text-white'} />
            </Link>
            <div>
              <h1 className={`text-xl font-semibold ${isPremium ? 'text-gray-900' : 'text-white'} flex items-center`}>
                <TrendingDown size={24} className={`mr-2 ${isPremium ? 'text-gray-600' : 'text-white'}`} />
                Sell Crypto - Bank Transfer
              </h1>
              <p className={`text-sm ${isPremium ? 'text-gray-600' : 'text-blue-100'}`}>
                {step === 1 && 'Enter crypto amount and bank details'}
                {step === 2 && 'Choose your buyer'}
                {step === 3 && 'Confirm trade details'}
              </p>
            </div>
          </div>
          {isPremium && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
              <Crown size={12} className="mr-1" />
              Premium
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Step 1: Amount and Bank Details */}
        {step === 1 && (
          <>
            {/* Cryptocurrency Selection */}
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Select Cryptocurrency to Sell</h3>
              <div className="grid grid-cols-2 gap-3">
                {cryptocurrencies.map((crypto) => (
                  <button
                    key={crypto.value}
                    onClick={() => handleInputChange('cryptocurrency', crypto.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      formData.cryptocurrency === crypto.value
                        ? isPremium
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{crypto.icon}</span>
                        <span className="font-medium">{crypto.label}</span>
                      </div>
                      {isPremium && <Crown size={12} className="text-yellow-500" />}
                    </div>
                    <div className="text-sm text-gray-600">₦{crypto.rate.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Crypto Amount Input */}
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Amount to Sell</h3>
              <Input
                type="number"
                placeholder={`Enter ${formData.cryptocurrency || 'crypto'} amount`}
                value={formData.cryptoAmount}
                onChange={(e) => handleInputChange('cryptoAmount', e.target.value)}
                className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
              />
              {formData.cryptocurrency && formData.cryptoAmount && (
                <div className={`mt-3 p-3 rounded-lg ${isPremium ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={isPremium ? 'text-yellow-700' : 'text-blue-700'}>You will receive:</span>
                    <span className={`font-bold ${isPremium ? 'text-yellow-900' : 'text-blue-900'}`}>
                      ₦{calculateNairaAmount()}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Bank Details */}
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Building2 size={20} className="mr-2 text-gray-600" />
                Bank Account Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <Input
                    placeholder="Full name as on bank account"
                    value={formData.bankDetails.accountName}
                    onChange={(e) => handleInputChange('bankDetails.accountName', e.target.value)}
                    className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <Input
                    placeholder="10-digit account number"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => handleInputChange('bankDetails.accountNumber', e.target.value)}
                    maxLength={10}
                    className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <Input
                    placeholder="e.g., First Bank of Nigeria"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => handleInputChange('bankDetails.bankName', e.target.value)}
                    className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                  />
                </div>
              </div>
            </Card>

            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid()}
              className={`w-full h-12 ${
                isPremium
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isPremium && <Crown size={16} className="mr-2" />}
              Find Buyers
            </Button>
          </>
        )}

        {/* Step 2: Buyer Selection */}
        {step === 2 && (
          <>
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Available Buyers</h3>
              <div className="space-y-3">
                {buyers.map((buyer) => (
                  <div
                    key={buyer.id}
                    onClick={() => handleSelectBuyer(buyer)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      isPremium
                        ? 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{buyer.name}</span>
                            {buyer.isPremium && <Crown size={12} className="text-yellow-500" />}
                            {buyer.online && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star size={12} className="text-yellow-400 mr-1 fill-current" />
                              {buyer.rating}
                            </div>
                            <span>{buyer.trades} trades</span>
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {buyer.responseTime}
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium text-gray-900 ml-2">₦{buyer.rate.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Purchase:</span>
                        <span className="font-medium text-gray-900 ml-2">{buyer.maxPurchase}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Payment: </span>
                      <span className="text-gray-900 text-sm">{buyer.paymentMethods.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="w-full"
            >
              Back to Details
            </Button>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && formData.selectedBuyer && (
          <>
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-4">Trade Confirmation</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">You send:</span>
                  <span className="font-medium text-gray-900">{formData.cryptoAmount} {formData.cryptocurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You receive:</span>
                  <span className="font-medium text-gray-900">₦{calculateNairaAmount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer:</span>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">{formData.selectedBuyer.name}</span>
                    {formData.selectedBuyer.isPremium && <Crown size={12} className="text-yellow-500" />}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium text-gray-900">₦{formData.selectedBuyer.rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Account:</span>
                  <span className="font-medium text-gray-900">{formData.bankDetails.accountNumber}</span>
                </div>
              </div>
            </Card>

            {/* Security Notice */}
            <Card className={`p-4 ${isPremium ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start space-x-3">
                <Shield size={20} className={isPremium ? 'text-yellow-600' : 'text-blue-600'} />
                <div>
                  <h4 className={`font-medium ${isPremium ? 'text-yellow-900' : 'text-blue-900'}`}>Secure Escrow Protection</h4>
                  <p className={`text-sm ${isPremium ? 'text-yellow-700' : 'text-blue-700'}`}>
                    Your crypto will be held in secure escrow until payment is confirmed in your bank account.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={handleConfirmTrade}
                className={`w-full h-12 ${
                  isPremium
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isPremium && <Crown size={16} className="mr-2" />}
                Create Sell Order
              </Button>
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="w-full"
              >
                Back to Buyers
              </Button>
            </div>
          </>
        )}
      </div>

      {isPremium ? <PremiumBottomNavigation /> : <BottomNavigation />}
    </div>
  );
};

export default SellCryptoBankTransfer;
