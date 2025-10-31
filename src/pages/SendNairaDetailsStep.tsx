import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Truck, Phone, Calendar, Clock, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { creditsService } from '@/services/creditsService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SendNairaDetailsStep = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Get data from URL params
  const nairaAmount = searchParams.get('nairaAmount') || '';
  const usdAmount = searchParams.get('usdAmount') || '';
  const creditsRequired = parseInt(searchParams.get('creditsRequired') || '0');
  const deliveryType = searchParams.get('deliveryType') as 'pickup' | 'delivery';
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Delivery specific
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  
  // Pickup specific
  const [pickupLocation, setPickupLocation] = useState('');
  
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nairaAmount || !usdAmount || !deliveryType) {
      navigate('/send-naira-get-usd');
      return;
    }
    
    if (user) {
      loadUserCredits();
      loadUserProfile();
    }
  }, [user, nairaAmount, usdAmount, deliveryType]);

  const loadUserCredits = async () => {
    try {
      const credits = await creditsService.getUserCredits(user!.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('user_id', user!.id)
        .single();
      
      if (profile?.phone_number) {
        setPhoneNumber(profile.phone_number);
        setWhatsappNumber(profile.phone_number);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const serviceFee = 0; // No service fee for now

  const handleContinue = async () => {
    if (!user) return;
    
    // Validation
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: "Delivery address required",
        description: "Please enter your delivery address",
        variant: "destructive",
      });
      return;
    }

    if (deliveryType === 'pickup' && !pickupLocation.trim()) {
      toast({
        title: "Pickup location required",
        description: "Please select a pickup location",
        variant: "destructive",
      });
      return;
    }

    // Check credits again
    if (creditsRequired > userCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsRequired} credits but only have ${userCredits}. Please purchase more credits.`,
        variant: "destructive",
      });
      navigate('/credits/purchase');
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        nairaAmount,
        usdAmount,
        serviceFee: 0,
        creditsRequired,
        deliveryMethod: deliveryType,
        phoneNumber,
        whatsappNumber: whatsappNumber || phoneNumber,
        preferredDate,
        preferredTime,
        additionalNotes,
        ...(deliveryType === 'delivery' 
          ? { deliveryAddress: { address: deliveryAddress, landmark } }
          : { pickupLocation }
        )
      };

      // Navigate to payment step
      navigate('/send-naira-payment-step', {
        state: { orderData }
      });
    } catch (error) {
      console.error('Error preparing order:', error);
      toast({
        title: "Error",
        description: "Failed to prepare order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pickupLocations = [
    'Lagos Island',
    'Victoria Island',
    'Ikoyi',
    'Lekki Peninsula',
    'Surulere',
    'Badagry',
    'Eko Atlantic City',
    'Onikan',
    'Apapa',
    'Mile 2',
    'Yaba',
    'Ikeja',
    'Ajah',
    'Makoko',
    'Ikorodu',
    'Festac Town',
    'Ejigbo',
    'Mushin',
    'Agbara',
    'Shomolu'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <button onClick={() => navigate('/send-naira-get-usd')} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {deliveryType === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Summary */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white">Naira Amount:</span>
              <span className="font-semibold text-white">₦{parseFloat(nairaAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white">USD Amount:</span>
              <span className="font-semibold text-white">${usdAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white">Credits Charged:</span>
              <span className="font-semibold text-white">{creditsRequired} credits</span>
            </div>
            <hr className="border-blue-200" />
            <div className="flex justify-between text-lg">
              <span className="text-white font-medium">Total to Pay:</span>
              <span className="font-bold text-white">₦{parseFloat(nairaAmount).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., +234 801 234 5678"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number (Optional)
              </label>
              <Input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Same as phone number if not provided"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery/Pickup Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {deliveryType === 'pickup' ? (
                <MapPin className="w-5 h-5 text-purple-600" />
              ) : (
                <Truck className="w-5 h-5 text-purple-600" />
              )}
              <span>
                {deliveryType === 'pickup' ? 'Pickup Location' : 'Delivery Address'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryType === 'pickup' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pickup Location *
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a location</option>
                  {pickupLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    className="w-full"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark (Optional)
                  </label>
                  <Input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g., Near First Bank, Opposite Mall"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preferred Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>Preferred Time (Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <Input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 8PM)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span>Additional Notes (Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any special instructions or notes for the vendor"
              className="w-full"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={
            loading ||
            !phoneNumber.trim() ||
            (deliveryType === 'delivery' && !deliveryAddress.trim()) ||
            (deliveryType === 'pickup' && !pickupLocation.trim()) ||
            creditsRequired > userCredits
          }
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </div>
    </div>
  );
};

export default SendNairaDetailsStep;