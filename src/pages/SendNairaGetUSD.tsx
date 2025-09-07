import React, { useState } from 'react';
import { ArrowLeft, Crown, DollarSign, MapPin, Phone, Clock, Truck, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const SendNairaGetUSD = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nairaAmount: '',
    deliveryMethod: '', // 'pickup' or 'delivery'
    pickupLocation: '',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      landmark: ''
    },
    phoneNumber: '',
    whatsappNumber: '',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: ''
  });

  const currentUSDRate = 1545; // 1 USD = 1545 NGN
  
  const pickupLocations = [
    { value: 'victoria_island', label: 'Victoria Island', address: 'Tiamiyu Savage Street, VI', fee: 2000 },
    { value: 'ikeja', label: 'Ikeja', address: 'Allen Avenue, Ikeja', fee: 2000 },
    { value: 'lekki', label: 'Lekki Phase 1', address: 'Admiralty Way, Lekki', fee: 3000 },
    { value: 'surulere', label: 'Surulere', address: 'Adeniran Ogunsanya Street', fee: 2000 },
    { value: 'mainland', label: 'Lagos Mainland', address: 'Herbert Macaulay Way', fee: 2000 },
    { value: 'abuja_central', label: 'Abuja Central', address: 'Wuse 2 District', fee: 3000 }
  ];

  const deliveryZones = [
    { zone: 'Lagos Island', fee: 5000, time: '2-4 hours' },
    { zone: 'Lagos Mainland', fee: 7000, time: '3-5 hours' },
    { zone: 'Lekki/Ajah', fee: 8000, time: '3-6 hours' },
    { zone: 'Abuja FCT', fee: 10000, time: '4-8 hours' },
    { zone: 'Other States', fee: 15000, time: '6-12 hours' }
  ];

  const timeSlots = [
    { value: 'morning', label: '9:00 AM - 12:00 PM', available: true },
    { value: 'afternoon', label: '12:00 PM - 4:00 PM', available: true },
    { value: 'evening', label: '4:00 PM - 7:00 PM', available: true },
    { value: 'night', label: '7:00 PM - 9:00 PM', available: false }
  ];

  const calculateUSDAmount = () => {
    if (!formData.nairaAmount) return '0';
    const nairaAmount = parseFloat(formData.nairaAmount);
    const usdAmount = nairaAmount / currentUSDRate;
    return usdAmount.toFixed(2);
  };

  const getServiceFee = () => {
    if (formData.deliveryMethod === 'pickup') {
      const selectedLocation = pickupLocations.find(loc => loc.value === formData.pickupLocation);
      return selectedLocation?.fee || 0;
    } else if (formData.deliveryMethod === 'delivery') {
      const city = formData.deliveryAddress.city.toLowerCase();
      const state = formData.deliveryAddress.state.toLowerCase();
      
      if (city.includes('lagos') || state.includes('lagos')) {
        if (city.includes('island') || city.includes('victoria')) return 5000;
        if (city.includes('lekki') || city.includes('ajah')) return 8000;
        return 7000;
      }
      if (city.includes('abuja') || state.includes('abuja') || state.includes('fct')) return 10000;
      return 15000;
    }
    return 0;
  };

  const calculateNetUSD = () => {
    const grossUSD = parseFloat(calculateUSDAmount());
    const feeNaira = getServiceFee();
    const feeUSD = feeNaira / currentUSDRate;
    return (grossUSD - feeUSD).toFixed(2);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('deliveryAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleConfirmOrder = () => {
    // Navigate to payment step instead of directly to thank you page
    navigate('/send-naira-payment', {
      state: {
        orderData: {
          nairaAmount: formData.nairaAmount,
          usdAmount: calculateNetUSD(),
          deliveryMethod: formData.deliveryMethod,
          pickupLocation: formData.pickupLocation,
          deliveryAddress: formData.deliveryAddress,
          phoneNumber: formData.phoneNumber,
          whatsappNumber: formData.whatsappNumber,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          serviceFee: getServiceFee(),
          additionalNotes: formData.additionalNotes
        }
      }
    });
  };

  const isStep1Valid = () => {
    return formData.nairaAmount && formData.deliveryMethod;
  };

  const isStep2Valid = () => {
    if (formData.deliveryMethod === 'pickup') {
      return formData.pickupLocation && 
             formData.phoneNumber && 
             formData.whatsappNumber &&
             formData.preferredDate &&
             formData.preferredTime;
    } else {
      return formData.deliveryAddress.street && 
             formData.deliveryAddress.city && 
             formData.deliveryAddress.state && 
             formData.phoneNumber && 
             formData.whatsappNumber &&
             formData.preferredDate &&
             formData.preferredTime;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isPremium ? "/premium-trade" : "/buy-sell"} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <DollarSign size={24} className="mr-2 text-gray-600" />
                Send Naira, Get USD
              </h1>
              <p className="text-gray-600 text-sm">Convert your Naira to USD cash</p>
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
        {/* Step 1: Amount and Delivery Method */}
        {step === 1 && (
          <>
            {/* Premium Feature Notice */}
            {isPremium && (
              <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
                <div className="flex items-center space-x-3">
                  <Crown size={24} className="text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Premium USD Conversion Service</h3>
                    <p className="text-sm text-yellow-700">Convert your Naira to USD cash with premium rates and service</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Naira Amount Input */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Amount to Convert (Naira)</h3>
              <Input
                type="number"
                placeholder="Enter amount in Naira"
                value={formData.nairaAmount}
                onChange={(e) => handleInputChange('nairaAmount', e.target.value)}
                className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
              />
              {formData.nairaAmount && (
                <div className={`mt-3 p-3 rounded-lg ${isPremium ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={isPremium ? 'text-yellow-700' : 'text-blue-700'}>Exchange Rate:</span>
                    <span className={`font-medium ${isPremium ? 'text-yellow-900' : 'text-blue-900'}`}>
                      $1 = ₦{currentUSDRate.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isPremium ? 'text-yellow-700' : 'text-blue-700'}>You will receive:</span>
                    <span className={`font-bold ${isPremium ? 'text-yellow-900' : 'text-blue-900'}`}>
                      ${calculateUSDAmount()} USD
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Delivery Method */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">How would you like to receive your USD?</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleInputChange('deliveryMethod', 'pickup')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    formData.deliveryMethod === 'pickup'
                      ? isPremium
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className={isPremium ? 'text-yellow-600' : 'text-blue-600'} />
                      <div>
                        <div className="font-medium text-gray-900">Cash Pickup</div>
                        <div className="text-sm text-gray-600">Collect USD cash at designated location</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">₦2,000-3,000</div>
                      <div className="text-xs text-gray-600">Service fee</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleInputChange('deliveryMethod', 'delivery')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    formData.deliveryMethod === 'delivery'
                      ? isPremium
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Truck size={20} className={isPremium ? 'text-yellow-600' : 'text-blue-600'} />
                      <div>
                        <div className="font-medium text-gray-900">Cash Delivery</div>
                        <div className="text-sm text-gray-600">USD cash delivered to your address</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">₦5,000-15,000</div>
                      <div className="text-xs text-gray-600">Service fee</div>
                    </div>
                  </div>
                </button>
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
              Continue
            </Button>
          </>
        )}

        {/* Step 2: Details Collection */}
        {step === 2 && (
          <>
            {/* Location/Address */}
            {formData.deliveryMethod === 'pickup' ? (
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
                          ? isPremium
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{location.label}</div>
                          <div className="text-sm text-gray-600">{location.address}</div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">₦{location.fee.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-4 bg-white border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin size={20} className="mr-2 text-gray-600" />
                  Delivery Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <Input
                      placeholder="House number and street name"
                      value={formData.deliveryAddress.street}
                      onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
                      className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <Input
                        placeholder="e.g., Lagos"
                        value={formData.deliveryAddress.city}
                        onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                        className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <Input
                        placeholder="e.g., Lagos State"
                        value={formData.deliveryAddress.state}
                        onChange={(e) => handleInputChange('deliveryAddress.state', e.target.value)}
                        className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                    <Input
                      placeholder="Nearby landmark for easy location"
                      value={formData.deliveryAddress.landmark}
                      onChange={(e) => handleInputChange('deliveryAddress.landmark', e.target.value)}
                      className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                    />
                  </div>
                </div>
              </Card>
            )}

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
                    placeholder="+234 802 123 4567"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                  <Input
                    type="tel"
                    placeholder="+234 802 123 4567"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                    className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                  />
                </div>
              </div>
            </Card>

            {/* Preferred Date and Time */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Clock size={20} className="mr-2 text-gray-600" />
                Preferred Date & Time
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.preferredDate}
                    onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                    className={isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Time *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => handleInputChange('preferredTime', slot.value)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg border-2 transition-colors text-left ${
                          formData.preferredTime === slot.value
                            ? isPremium
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-blue-500 bg-blue-50'
                            : slot.available 
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-gray-100 bg-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">{slot.label}</div>
                        {!slot.available && <div className="text-xs text-gray-500">Not available</div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Notes */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Notes (Optional)</h3>
              <Textarea
                placeholder="Special instructions, gate codes, or any other information"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className={`min-h-[80px] ${isPremium ? 'border-yellow-200 focus:border-yellow-400' : ''}`}
              />
            </Card>

            {/* Order Summary */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Naira Amount:</span>
                  <span className="font-medium">₦{parseFloat(formData.nairaAmount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-medium">₦{getServiceFee().toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-medium">You'll Receive:</span>
                  <span className="font-bold text-green-600">${calculateNetUSD()} USD</span>
                </div>
              </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmOrder}
                disabled={!isStep2Valid()}
                className={`flex-1 h-12 ${
                  isPremium
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isPremium && <Crown size={16} className="mr-2" />}
                Proceed to Payment
              </Button>
            </div>
          </>
        )}
      </div>

      {isPremium && <PremiumBottomNavigation />}
    </div>
  );
};

export default SendNairaGetUSD;