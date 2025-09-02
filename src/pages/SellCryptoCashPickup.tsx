import React, { useState } from 'react';
import { ArrowLeft, Crown, TrendingDown, MapPin, Phone, Clock, Shield, DollarSign, Key } from 'lucide-react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const SellCryptoCashPickup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const preselectedCoin = searchParams.get('coin');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const prefilledData = location.state?.prefilledData;
    console.log('Pickup page prefilled data:', prefilledData); // Debug log
    return {
      cryptocurrency: preselectedCoin || prefilledData?.cryptocurrency || '',
      cryptoAmount: prefilledData?.cryptoAmount || '',
      currencyPreference: 'USD', // USD only for pickup too
      pickupLocation: '',
      phoneNumber: prefilledData?.phoneNumber || '',
      whatsappNumber: '',
      preferredDate: '',
      preferredTime: '',
      additionalNotes: ''
    };
  });

  const cryptocurrencies = [
    { value: 'BTC', label: 'Bitcoin', symbol: '₿', rate: 150234500, usdRate: 97234, icon: '₿' },
    { value: 'ETH', label: 'Ethereum', symbol: 'Ξ', rate: 5358309, usdRate: 3470, icon: 'Ξ' },
    { value: 'USDT', label: 'Tether', symbol: '₮', rate: 1550, usdRate: 1, icon: '₮' },
    { value: 'BNB', label: 'BNB', symbol: 'B', rate: 1073298, usdRate: 695, icon: 'B' },
    { value: 'SOL', label: 'Solana', symbol: '◎', rate: 380789, usdRate: 246, icon: '◎' },
    { value: 'ADA', label: 'Cardano', symbol: '₳', rate: 1907, usdRate: 1.23, icon: '₳' },
    { value: 'MATIC', label: 'Polygon', symbol: 'M', rate: 1389, usdRate: 0.90, icon: 'M' },
    { value: 'DOT', label: 'Polkadot', symbol: '●', rate: 11234, usdRate: 7.26, icon: '●' },
    { value: 'AVAX', label: 'Avalanche', symbol: 'A', rate: 58923, usdRate: 38.15, icon: 'A' },
    { value: 'LINK', label: 'Chainlink', symbol: 'L', rate: 23456, usdRate: 15.18, icon: 'L' },
    { value: 'UNI', label: 'Uniswap', symbol: 'U', rate: 15678, usdRate: 10.14, icon: 'U' },
    { value: 'LTC', label: 'Litecoin', symbol: 'Ł', rate: 234567, usdRate: 151.89, icon: 'Ł' },
    { value: 'XRP', label: 'Ripple', symbol: 'X', rate: 987, usdRate: 0.64, icon: 'X' },
    { value: 'DOGE', label: 'Dogecoin', symbol: 'D', rate: 234, usdRate: 0.15, icon: 'D' }
  ];

  const pickupLocations = [
    { value: 'victoria_island', label: 'Victoria Island', address: 'Tiamiyu Savage Street, VI', fee: '$2' },
    { value: 'ikeja', label: 'Ikeja', address: 'Allen Avenue, Ikeja', fee: '$2' },
    { value: 'lekki', label: 'Lekki Phase 1', address: 'Admiralty Way, Lekki', fee: '$3' },
    { value: 'surulere', label: 'Surulere', address: 'Adeniran Ogunsanya Street', fee: '$2' },
    { value: 'mainland', label: 'Lagos Mainland', address: 'Herbert Macaulay Way', fee: '$2' },
    { value: 'abuja_central', label: 'Abuja Central', address: 'Wuse 2 District', fee: '$3' }
  ];

  const timeSlots = [
    { value: 'morning', label: '9:00 AM - 12:00 PM', available: true },
    { value: 'afternoon', label: '12:00 PM - 4:00 PM', available: true },
    { value: 'evening', label: '4:00 PM - 7:00 PM', available: true },
    { value: 'night', label: '7:00 PM - 9:00 PM', available: false }
  ];

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        available: true
      });
    }
    return days;
  };

  const getSelectedCrypto = () => {
    return cryptocurrencies.find(crypto => crypto.value === formData.cryptocurrency);
  };

  const calculateAmount = () => {
    const selectedCrypto = getSelectedCrypto();
    if (!selectedCrypto || !formData.cryptoAmount) return '0';

    const cryptoAmount = parseFloat(formData.cryptoAmount);
    const usdAmount = cryptoAmount * selectedCrypto.usdRate;
    return usdAmount.toFixed(2);
  };

  const calculatePlatformFee = () => {
    const selectedLocation = pickupLocations.find(loc => loc.value === formData.pickupLocation);
    return selectedLocation?.fee || '$0';
  };

  const calculateNetAmount = () => {
    const grossAmount = parseFloat(calculateAmount());
    const feeUSD = parseFloat(calculatePlatformFee().replace('$', ''));
    return (grossAmount - feeUSD).toFixed(2);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePickupCode = () => {
    const prefix = 'TH';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}-${random}`;
  };

  const handleConfirmPickup = () => {
    const pickupCode = generatePickupCode();
    
    toast({
      title: "Premium Cash Pickup Confirmed",
      description: `Your pickup code is ${pickupCode}. Keep it safe!`,
    });
    
    // Navigate to thank you page
    navigate('/cash-order-thank-you', {
      state: {
        orderType: 'pickup',
        code: pickupCode,
        amount: calculateNetAmount(),
        currency: 'USD',
        estimatedTime: '1-3 hours'
      }
    });
  };

  const isFormValid = () => {
    return formData.cryptocurrency &&
           formData.cryptoAmount &&
           formData.pickupLocation &&
           formData.phoneNumber &&
           formData.whatsappNumber &&
           formData.preferredDate &&
           formData.preferredTime;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/sell-for-cash" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <DollarSign size={24} className="mr-2 text-gray-600" />
                Cash Pickup
              </h1>
              <p className="text-gray-600 text-sm">Get USD cash at your preferred location</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium Only
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Premium Feature Notice */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Crown size={24} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Premium Cash Pickup Service</h3>
              <p className="text-sm text-yellow-700">Convert your crypto to USD cash and pick up at convenient locations</p>
            </div>
          </div>
        </Card>

        {/* Cryptocurrency Selection */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Select Cryptocurrency to Sell</h3>
          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {cryptocurrencies.map((crypto) => (
              <button
                key={crypto.value}
                onClick={() => handleInputChange('cryptocurrency', crypto.value)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  formData.cryptocurrency === crypto.value
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{crypto.icon}</span>
                    <span className="font-medium text-sm">{crypto.label}</span>
                  </div>
                  <Crown size={10} className="text-yellow-500" />
                </div>
                <div className="text-xs text-gray-600">${crypto.usdRate.toLocaleString()}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Crypto Amount Input */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Amount to Sell</h3>
          <Input
            type="number"
            placeholder={`Enter ${formData.cryptocurrency || 'crypto'} amount`}
            value={formData.cryptoAmount}
            onChange={(e) => handleInputChange('cryptoAmount', e.target.value)}
            className="border-yellow-200 focus:border-yellow-400"
          />
        </Card>

        {/* USD Pickup Notice */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Crown size={24} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Premium USD Cash Pickup</h3>
              <p className="text-sm text-yellow-700">Get US Dollars at your preferred pickup location</p>
            </div>
          </div>

          {formData.cryptocurrency && formData.cryptoAmount && (
            <div className="mt-4 space-y-2">
              <div className="p-3 rounded-lg bg-white border border-yellow-300">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-700">Gross USD Amount:</span>
                  <span className="font-bold text-yellow-900">${calculateAmount()}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">You will receive:</span>
                  <span className="font-bold text-green-900">${calculateNetAmount()} USD Cash</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Pickup Location */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Pickup Location
          </h3>
          <div className="space-y-3">
            {pickupLocations.map((location) => (
              <button
                key={location.value}
                onClick={() => handleInputChange('pickupLocation', location.value)}
                className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                  formData.pickupLocation === location.value
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{location.label}</div>
                    <div className="text-sm text-gray-600">{location.address}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{location.fee}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Phone size={20} className="mr-2 text-gray-600" />
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <Input
                type="tel"
                placeholder="+234 801 234 5678"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="border-yellow-200 focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
              <Input
                type="tel"
                placeholder="+234 801 234 5678"
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                className="border-yellow-200 focus:border-yellow-400"
              />
            </div>
          </div>
        </Card>

        {/* Pickup Date */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Clock size={20} className="mr-2 text-gray-600" />
            Preferred Pickup Date
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <Input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border-yellow-200 focus:border-yellow-400"
              />
            </div>
            <div className="text-sm text-gray-600">
              <strong>Note:</strong> Pickup available within 1-3 hours for same-day orders placed before 7 PM
            </div>
          </div>
        </Card>

        {/* Preferred Time */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Clock size={20} className="mr-2 text-gray-600" />
            Preferred Pickup Time
          </h3>
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.value}
                onClick={() => slot.available && handleInputChange('preferredTime', slot.value)}
                disabled={!slot.available}
                className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                  formData.preferredTime === slot.value
                    ? 'border-yellow-500 bg-yellow-50'
                    : slot.available
                    ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${slot.available ? 'text-gray-900' : 'text-gray-500'}`}>
                    {slot.label}
                  </span>
                  {!slot.available && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Unavailable</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Additional Notes */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Additional Notes (Optional)</h3>
          <Textarea
            placeholder="Any special pickup instructions or additional information..."
            value={formData.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            className="border-yellow-200 focus:border-yellow-400 min-h-[80px]"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.additionalNotes.length}/500 characters
          </div>
        </Card>

        {/* Fee Breakdown */}
        {formData.cryptoAmount && formData.pickupLocation && (
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Fee Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Crypto Value:</span>
                <span className="font-medium text-gray-900">${calculateAmount()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee:</span>
                <span className="font-medium text-gray-900">{calculatePlatformFee()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Net Amount (USD Cash):</span>
                  <span className="font-bold text-green-600">${calculateNetAmount()}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">How Cash Pickup Works</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Your crypto goes to a verified buyer through our P2P system</li>
                <li>• The buyer's Naira payment goes to our agent's account</li>
                <li>• Our agent converts Naira to USD and brings cash to pickup location</li>
                <li>• You provide your unique pickup code to receive USD cash</li>
                <li>• Agent verifies code before handing over cash</li>
              </ul>
            </div>
          </div>
        </Card>

        <Button
          onClick={handleConfirmPickup}
          disabled={!isFormValid()}
          className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <Key size={16} className="mr-2" />
          Confirm Cash Pickup Order
        </Button>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default SellCryptoCashPickup;
