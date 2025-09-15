import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, DollarSign, MapPin, Phone, Clock, Truck, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { AddressContactSelector } from '@/components/AddressContactSelector';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SendNairaGetUSD = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [prefilledAddress, setPrefilledAddress] = useState(null);
  const [prefilledContact, setPrefilledContact] = useState(null);

  const loadPrefilledData = async () => {
    try {
      // Load default address
      const { data: addresses } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (addresses && addresses.length > 0) {
        setPrefilledAddress(addresses[0]);
      }

      // Load default contact
      const { data: contacts } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (contacts && contacts.length > 0) {
        setPrefilledContact(contacts[0]);
      }
    } catch (error) {
      console.error('Error loading prefilled data:', error);
    }
  };

  useEffect(() => {
    if (user && isPremium) {
      loadPrefilledData();
    }
  }, [user, isPremium]);

  useEffect(() => {
    // Auto-fill form fields when prefilled data loads (like Google saved cards)
    if (prefilledAddress) {
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          street: prefilledAddress.street,
          city: prefilledAddress.city,
          state: prefilledAddress.state,
          landmark: prefilledAddress.landmark || ''
        }
      }));
    }
    if (prefilledContact) {
      setFormData(prev => ({
        ...prev,
        phoneNumber: prefilledContact.phone_number,
        whatsappNumber: prefilledContact.whatsapp_number
      }));
    }
  }, [prefilledAddress, prefilledContact]);
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
            <Link to="/premium-trade" className="mr-4">
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
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
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
            {/* Naira Amount Input */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Amount to Convert (Naira)</h3>
              <Input
                type="number"
                placeholder="Enter amount in Naira"
                value={formData.nairaAmount}
                onChange={(e) => handleInputChange('nairaAmount', e.target.value)}
              />
              {formData.nairaAmount && (
                <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-700">Exchange Rate:</span>
                    <span className="font-medium text-blue-900">
                      $1 = ₦{currentUSDRate.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">You will receive:</span>
                    <span className="font-bold text-blue-900">
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
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className="text-blue-600" />
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
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Truck size={20} className="text-blue-600" />
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
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
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
                          ? 'border-blue-500 bg-blue-50'
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
            ) : null}

            {/* Delivery Address for delivery method */}
            {formData.deliveryMethod === 'delivery' && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin size={20} className="mr-2 text-gray-600" />
                  Delivery Address
                </h3>
                
                {prefilledAddress && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium flex items-center">
                      <MapPin size={12} className="mr-1" />
                      Auto-filled from your profile
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <Input
                      placeholder="House number and street name"
                      value={formData.deliveryAddress.street}
                      onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <Input
                        placeholder="e.g., Lagos"
                        value={formData.deliveryAddress.city}
                        onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <Input
                        placeholder="e.g., Lagos State"
                        value={formData.deliveryAddress.state}
                        onChange={(e) => handleInputChange('deliveryAddress.state', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                    <Input
                      placeholder="Nearby landmark for easy location"
                      value={formData.deliveryAddress.landmark}
                      onChange={(e) => handleInputChange('deliveryAddress.landmark', e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Phone size={20} className="mr-2 text-gray-600" />
                Contact Information
              </h3>
              
              {prefilledContact && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium flex items-center">
                    <Phone size={12} className="mr-1" />
                    Auto-filled from your profile
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <Input
                    type="tel"
                    placeholder="+234 802 123 4567"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                  <Input
                    type="tel"
                    placeholder="+234 802 123 4567"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
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
                            ? 'border-blue-500 bg-blue-50'
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
                className="min-h-[80px]"
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
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
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