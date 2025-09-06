import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, TrendingUp, Star, Shield, Clock, User, ChevronRight, Zap } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import BottomNavigation from '@/components/BottomNavigation';

const EnhancedBuyCrypto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedCoin = searchParams.get('coin');
  const [cryptoPrice, setCryptoPrice] = useState(0);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cryptocurrency: preselectedCoin || '',
    nairaAmount: '',
    paymentMethod: '',
    selectedSeller: null as any
  });

  const cryptocurrencies = [
    { value: 'BTC', label: 'Bitcoin', symbol: '₿', rate: 150234500, icon: '₿' },
    { value: 'ETH', label: 'Ethereum', symbol: 'Ξ', rate: 5358309, icon: 'Ξ' },
    { value: 'USDT', label: 'Tether', symbol: '₮', rate: 1550, icon: '₮' },
    { value: 'BNB', label: 'BNB', symbol: 'B', rate: 1073298, icon: 'B' },
    { value: 'SOL', label: 'Solana', symbol: '◎', rate: 380789, icon: '◎' },
    { value: 'ADA', label: 'Cardano', symbol: '₳', rate: 1907, icon: '₳' },
    { value: 'MATIC', label: 'Polygon', symbol: 'M', rate: 1389, icon: 'M' },
    { value: 'DOT', label: 'Polkadot', symbol: '●', rate: 11234, icon: '●' },
    { value: 'AVAX', label: 'Avalanche', symbol: 'A', rate: 58923, icon: 'A' },
    { value: 'LINK', label: 'Chainlink', symbol: 'L', rate: 23456, icon: 'L' },
    { value: 'UNI', label: 'Uniswap', symbol: 'U', rate: 15678, icon: 'U' },
    { value: 'LTC', label: 'Litecoin', symbol: 'Ł', rate: 234567, icon: 'Ł' }
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', fee: '0%', time: '5-10 mins', description: 'Direct bank transfer to seller' }
  ];

  const [sellers, setSellers] = useState<any[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);

  const getSelectedCrypto = () => {
    return cryptocurrencies.find(crypto => crypto.value === formData.cryptocurrency);
  };

  const calculateCryptoAmount = () => {
    const selectedCrypto = getSelectedCrypto();
    if (!selectedCrypto || !formData.nairaAmount) return '0';
    
    const nairaAmount = parseFloat(formData.nairaAmount);
    const cryptoAmount = nairaAmount / selectedCrypto.rate;
    return cryptoAmount.toFixed(8);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectSeller = (seller: any) => {
    setFormData(prev => ({
      ...prev,
      selectedSeller: seller
    }));
    setStep(3);
  };

  useEffect(() => {
    // Set default crypto price
    const selectedCrypto = cryptocurrencies.find(c => c.value === formData.cryptocurrency);
    if (selectedCrypto) {
      setCryptoPrice(selectedCrypto.rate);
    }
    // Load real merchants from database
    loadMerchants();
  }, [formData.cryptocurrency, user]);

  const loadMerchants = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingSellers(true);
      const { data: merchants, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          is_merchant,
          merchant_mode,
          user_type,
          created_at
        `)
        .eq('is_merchant', true)
        .eq('merchant_mode', true)
        .neq('user_id', user.id); // Exclude current user

      if (error) {
        console.error('Error loading merchants:', error);
        setSellers([]);
        return;
      }

      if (!merchants || merchants.length === 0) {
        setSellers([]);
        return;
      }

      // Transform to seller format
      const transformedSellers = merchants.map((merchant, index) => ({
        id: merchant.user_id,
        name: merchant.display_name || `Merchant ${index + 1}`,
        rating: 4.5 + Math.random() * 0.5, // Random rating for now
        trades: Math.floor(Math.random() * 1000) + 100,
        rate: cryptoPrice * (1 + (Math.random() * 0.002 - 0.001)), // Small price variation
        available: `${(Math.random() * 3 + 0.5).toFixed(1)} ${formData.cryptocurrency}`,
        paymentMethods: ['Bank Transfer'],
        responseTime: `${Math.floor(Math.random() * 10) + 2} mins`,
        isPremium: merchant.user_type === 'premium',
        online: true
      }));

      setSellers(transformedSellers);
    } catch (error) {
      console.error('Error in loadMerchants:', error);
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  const handleConfirmTrade = () => {
    toast({
      title: isPremium ? "Premium Trade Initiated" : "Trade Initiated",
      description: `Your ${formData.cryptocurrency} purchase has been initiated with ${formData.selectedSeller.name}`,
    });
    
    // Navigate to payment status
    navigate(isPremium ? '/premium-payment-status' : '/payment-status', {
      state: {
        amount: calculateCryptoAmount(),
        nairaAmount: formData.nairaAmount,
        cryptocurrency: formData.cryptocurrency,
        seller: formData.selectedSeller,
        step: 1
      }
    });
  };

  return (
    <div className={`min-h-screen ${isPremium ? 'bg-gray-50' : 'bg-white'} pb-20`}>
      {/* Header */}
      <div className={`${isPremium ? 'bg-white border-b border-gray-200' : 'bg-blue-600'} px-4 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isPremium ? "/premium-trade" : "/buy-sell"} className="mr-4">
              <ArrowLeft size={24} className={isPremium ? 'text-gray-600' : 'text-white'} />
            </Link>
            <div>
              <h1 className={`text-xl font-semibold ${isPremium ? 'text-gray-900' : 'text-white'} flex items-center`}>
                <TrendingUp size={24} className={`mr-2 ${isPremium ? 'text-gray-600' : 'text-white'}`} />
                Buy Cryptocurrency
              </h1>
              <p className={`text-sm ${isPremium ? 'text-gray-600' : 'text-blue-100'}`}>
                {step === 1 && 'Enter amount and select payment method'}
                {step === 2 && 'Choose your seller'}
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
        {/* Step 1: Amount and Payment Method */}
        {step === 1 && (
          <>
            {/* Cryptocurrency Selection */}
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Select Cryptocurrency</h3>
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
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
                        <span className="text-lg mr-2">{crypto.icon}</span>
                        <span className="font-medium text-sm">{crypto.label}</span>
                      </div>
                      {isPremium && <Crown size={10} className="text-yellow-500" />}
                    </div>
                    <div className="text-xs text-gray-600">₦{crypto.rate.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Amount Input */}
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Amount to Spend (Naira)</h3>
              <Input
                type="number"
                placeholder="Enter amount in Naira"
                value={formData.nairaAmount}
                onChange={(e) => handleInputChange('nairaAmount', e.target.value)}
                className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
              />
              {formData.cryptocurrency && formData.nairaAmount && (
                <div className={`mt-3 p-3 rounded-lg ${isPremium ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={isPremium ? 'text-yellow-700' : 'text-blue-700'}>You will receive:</span>
                    <span className={`font-bold ${isPremium ? 'text-yellow-900' : 'text-blue-900'}`}>
                      {calculateCryptoAmount()} {formData.cryptocurrency}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Payment Method */}
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.value}
                    onClick={() => handleInputChange('paymentMethod', method.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      formData.paymentMethod === method.value
                        ? isPremium
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{method.label}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                        <div className="text-xs text-gray-500 mt-1">Fee: {method.fee} • Processing: {method.time}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.paymentMethod === method.value
                          ? isPremium
                            ? 'border-yellow-500 bg-yellow-500'
                            : 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.paymentMethod === method.value && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.cryptocurrency || !formData.nairaAmount || !formData.paymentMethod}
              className={`w-full h-12 ${
                isPremium
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isPremium && <Crown size={16} className="mr-2" />}
              Find Sellers
            </Button>
          </>
        )}

        {/* Step 2: Seller Selection */}
        {step === 2 && (
          <>
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-3">Available Sellers</h3>
              <div className="space-y-3">
                {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    onClick={() => handleSelectSeller(seller)}
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
                            <span className="font-medium text-gray-900">{seller.name}</span>
                            {seller.isPremium && <Crown size={12} className="text-yellow-500" />}
                            {seller.online && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star size={12} className="text-yellow-400 mr-1 fill-current" />
                              {seller.rating}
                            </div>
                            <span>{seller.trades} trades</span>
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {seller.responseTime}
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium text-gray-900 ml-2">₦{seller.rate.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium text-gray-900 ml-2">{seller.available}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Payment: </span>
                      <span className="text-gray-900 text-sm">{seller.paymentMethods.join(', ')}</span>
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
              Back to Amount
            </Button>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && formData.selectedSeller && (
          <>
            <Card className={`p-4 ${isPremium ? 'bg-white border-gray-200' : 'bg-white'}`}>
              <h3 className="font-semibold text-gray-900 mb-4">Trade Confirmation</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">You pay:</span>
                  <span className="font-medium text-gray-900">₦{parseFloat(formData.nairaAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You receive:</span>
                  <span className="font-medium text-gray-900">{calculateCryptoAmount()} {formData.cryptocurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller:</span>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">{formData.selectedSeller.name}</span>
                    {formData.selectedSeller.isPremium && <Crown size={12} className="text-yellow-500" />}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium text-gray-900">₦{formData.selectedSeller.rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment method:</span>
                  <span className="font-medium text-gray-900">{paymentMethods.find(p => p.value === formData.paymentMethod)?.label}</span>
                </div>
              </div>
            </Card>

            {isPremium && (
              <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
                <div className="flex items-center space-x-3">
                  <Zap size={20} className="text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Premium Trade Benefits</h4>
                    <p className="text-sm text-yellow-700">Priority processing, enhanced security, and dedicated support</p>
                  </div>
                </div>
              </Card>
            )}

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
                Confirm Trade
              </Button>
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="w-full"
              >
                Back to Sellers
              </Button>
            </div>
          </>
        )}
      </div>

      {isPremium ? <PremiumBottomNavigation /> : <BottomNavigation />}
    </div>
  );
};

export default EnhancedBuyCrypto;
