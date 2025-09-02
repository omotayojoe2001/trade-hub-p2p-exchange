import React, { useState } from 'react';
import { ArrowLeft, Crown, DollarSign, Banknote, Clock, Shield, Truck, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const SellForCash = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sellData, setSellData] = useState({
    cryptocurrency: '',
    amount: '',
    deliveryMethod: '',
    location: '',
    phoneNumber: ''
  });

  const cryptocurrencies = [
    { value: 'BTC', label: 'Bitcoin (BTC)', price: '$97,234.50', rate: '₦150,000,000' },
    { value: 'ETH', label: 'Ethereum (ETH)', price: '$3,456.78', rate: '₦5,350,000' },
    { value: 'USDT', label: 'Tether (USDT)', price: '$1.00', rate: '₦1,550' },
    { value: 'BNB', label: 'BNB (BNB)', price: '$692.45', rate: '₦1,073,000' },
    { value: 'SOL', label: 'Solana (SOL)', price: '$246.78', rate: '₦380,000' },
    { value: 'ADA', label: 'Cardano (ADA)', price: '$1.23', rate: '₦1,900' },
    { value: 'MATIC', label: 'Polygon (MATIC)', price: '$0.90', rate: '₦1,390' },
    { value: 'DOT', label: 'Polkadot (DOT)', price: '$7.26', rate: '₦11,200' },
    { value: 'AVAX', label: 'Avalanche (AVAX)', price: '$38.15', rate: '₦59,000' },
    { value: 'LINK', label: 'Chainlink (LINK)', price: '$15.18', rate: '₦23,500' },
    { value: 'UNI', label: 'Uniswap (UNI)', price: '$10.14', rate: '₦15,700' },
    { value: 'LTC', label: 'Litecoin (LTC)', price: '$151.89', rate: '₦235,000' },
    { value: 'XRP', label: 'Ripple (XRP)', price: '$0.64', rate: '₦990' },
    { value: 'DOGE', label: 'Dogecoin (DOGE)', price: '$0.15', rate: '₦235' }
  ];

  const deliveryMethods = [
    {
      value: 'bank',
      label: 'Bank Transfer',
      description: 'Naira transfer to your bank account',
      time: '5-15 minutes',
      fee: 'Free',
      icon: <Banknote className="text-purple-600" size={20} />
    },
    {
      value: 'doorstep',
      label: 'Cash Delivery (Premium)',
      description: 'USD cash delivered to your location',
      time: '2-6 hours',
      fee: '$5-15',
      icon: <Truck className="text-yellow-600" size={20} />,
      premium: true
    },
    {
      value: 'pickup',
      label: 'Cash Pickup (Premium)',
      description: 'Collect USD cash at designated location',
      time: '1-3 hours',
      fee: '$2-3',
      icon: <DollarSign className="text-yellow-600" size={20} />,
      premium: true
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setSellData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotal = () => {
    if (!sellData.cryptocurrency || !sellData.amount) return '₦0';
    
    const crypto = cryptocurrencies.find(c => c.value === sellData.cryptocurrency);
    if (!crypto) return '₦0';
    
    const rate = parseFloat(crypto.rate.replace(/[₦,]/g, ''));
    const amount = parseFloat(sellData.amount);
    const total = rate * amount;
    
    return `₦${total.toLocaleString()}`;
  };

  const handleSubmitSell = () => {
    if (!sellData.cryptocurrency || !sellData.amount || !sellData.deliveryMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Navigate to appropriate flow based on delivery method
    if (sellData.deliveryMethod === 'bank') {
      // For bank transfer, go directly to payment status
      navigate('/premium-payment-status', {
        state: {
          type: 'sell',
          cryptocurrency: sellData.cryptocurrency,
          amount: sellData.amount,
          method: 'bank_transfer',
          step: 1
        }
      });
    } else {
      // For cash delivery/pickup, go to detailed flow with pre-filled data
      const navigationState = {
        prefilledData: {
          cryptocurrency: sellData.cryptocurrency,
          cryptoAmount: sellData.amount,
          phoneNumber: sellData.phoneNumber,
          location: sellData.location
        }
      };

      if (sellData.deliveryMethod === 'doorstep') {
        navigate('/sell-crypto-cash-delivery', { state: navigationState });
      } else if (sellData.deliveryMethod === 'pickup') {
        navigate('/sell-crypto-cash-pickup', { state: navigationState });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-dashboard" className="mr-3">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center">
                <DollarSign size={24} className="mr-2" />
                Sell for Cash
              </h1>
              <p className="text-green-100 text-sm">Convert crypto to instant cash</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-xs font-bold">PREMIUM</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Premium Benefits */}
        <Card className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
          <h3 className="font-bold text-green-900 mb-3 flex items-center">
            <Crown size={20} className="mr-2" />
            Premium Cash Benefits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
              <div className="text-xs text-green-700">Instant Processing</div>
            </div>
            <div className="text-center">
              <Shield size={24} className="text-green-600 mx-auto mb-1" />
              <div className="text-xs text-green-700">Secure Delivery</div>
            </div>
            <div className="text-center">
              <Clock size={24} className="text-green-600 mx-auto mb-1" />
              <div className="text-xs text-green-700">24/7 Service</div>
            </div>
          </div>
        </Card>

        {/* Cryptocurrency Selection */}
        <Card className="p-4 bg-white border-green-200">
          <h3 className="font-semibold text-gray-900 mb-3">Select Cryptocurrency</h3>
          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {cryptocurrencies.map((crypto) => (
              <button
                key={crypto.value}
                onClick={() => handleInputChange('cryptocurrency', crypto.value)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  sellData.cryptocurrency === crypto.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col">
                  <div className="font-medium text-gray-900 text-sm">{crypto.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{crypto.price}</div>
                  <div className="text-xs font-medium text-green-600 mt-1">{crypto.rate}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Amount */}
        <Card className="p-4 bg-white border-green-200">
          <h3 className="font-semibold text-gray-900 mb-3">Amount to Sell</h3>
          <Input
            type="number"
            placeholder="0.00"
            value={sellData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="border-green-200 focus:border-green-400 mb-3"
          />
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">You'll receive:</span>
              <span className="text-2xl font-bold text-green-600">{calculateTotal()}</span>
            </div>
          </div>
        </Card>

        {/* Delivery Method */}
        <Card className="p-4 bg-white border-green-200">
          <h3 className="font-semibold text-gray-900 mb-3">Cash Delivery Method</h3>
          <div className="space-y-3">
            {deliveryMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => handleInputChange('deliveryMethod', method.value)}
                className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                  sellData.deliveryMethod === method.value
                    ? method.premium
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {method.icon}
                    <div className="ml-3">
                      <div className="font-medium text-gray-900 flex items-center">
                        {method.label}
                        {method.premium && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            Premium
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{method.fee}</div>
                    <div className="text-xs text-gray-500">{method.time}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Delivery Details */}
        {sellData.deliveryMethod === 'doorstep' && (
          <Card className="p-4 bg-white border-green-200">
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Location</h3>
            <Input
              placeholder="Enter your full address"
              value={sellData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="border-green-200 focus:border-green-400 mb-3"
            />
            <Input
              placeholder="Phone number for delivery"
              value={sellData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="border-green-200 focus:border-green-400"
            />
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmitSell}
          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg"
        >
          <DollarSign size={20} className="mr-2" />
          Sell for Cash Now
        </Button>

        {/* Security Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Secure Cash Delivery</h4>
              <p className="text-sm text-blue-700">
                All cash deliveries are insured and tracked. Our premium delivery agents are verified and bonded.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default SellForCash;
