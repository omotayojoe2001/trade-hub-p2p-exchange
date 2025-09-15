import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, MapPin, Phone, Plus, Calendar, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const PremiumCashDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prefilledAddress, setPrefilledAddress] = useState(null);
  const [prefilledContact, setPrefilledContact] = useState(null);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [showAddNewContact, setShowAddNewContact] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [newContact, setNewContact] = useState({
    phone_number: '',
    whatsapp_number: '',
    label: ''
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const timeSlots = [
    { value: 'morning', label: '9:00 AM - 12:00 PM' },
    { value: 'afternoon', label: '12:00 PM - 4:00 PM' },
    { value: 'evening', label: '4:00 PM - 7:00 PM' }
  ];

  useEffect(() => {
    loadPrefilledData();
    loadVendors();
  }, [user]);

  const loadVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('location');
      
      if (data) setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadPrefilledData = async () => {
    if (!user) return;
    try {
      // Load user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        // Create address object from profile location
        const addressFromProfile = {
          id: 'profile-address',
          street: profile.location || 'Address not provided',
          city: 'Lagos', // Default city
          state: 'Lagos State', // Default state
          landmark: '',
          label: 'Profile Address'
        };
        setPrefilledAddress(addressFromProfile);
        setSelectedAddress(addressFromProfile);
        
        // Auto-fill delivery address from profile
        if (profile.location) {
          setDeliveryAddress(profile.location);
        }

        // Create contact object from profile
        const contactFromProfile = {
          id: 'profile-contact',
          phone_number: profile.phone_number || '',
          whatsapp_number: profile.phone_number || '',
          label: 'Profile Contact'
        };
        setPrefilledContact(contactFromProfile);
        setSelectedContact(contactFromProfile);
      }
    } catch (error) {
      console.error('Error loading prefilled data:', error);
    }
  };

  const saveNewAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.label) return;

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: user?.id,
        ...newAddress
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedAddress(data);
      setShowAddNewAddress(false);
      setNewAddress({ street: '', city: '', state: '', landmark: '', label: '' });
    }
  };

  const saveNewContact = async () => {
    if (!newContact.phone_number || !newContact.whatsapp_number || !newContact.label) return;

    const { data, error } = await supabase
      .from('user_contacts')
      .insert({
        user_id: user?.id,
        ...newContact
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedContact(data);
      setShowAddNewContact(false);
      setNewContact({ phone_number: '', whatsapp_number: '', label: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-trade" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold flex items-center">
                <Crown size={20} className="mr-2 text-gray-600" />
                Premium Cash Delivery
              </h1>
              <p className="text-gray-600 text-sm">Delivery to your address</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Area Selection for Vendor Matching */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Select Closest Area(s)
          </h3>
          <p className="text-sm text-gray-600 mb-4">Choose the area(s) closest to your delivery address. This helps us assign the right vendor.</p>
          
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => {
                  const isSelected = selectedAreas.includes(vendor.location);
                  if (isSelected) {
                    setSelectedAreas(prev => prev.filter(area => area !== vendor.location));
                  } else {
                    setSelectedAreas(prev => [...prev, vendor.location]);
                  }
                }}
                className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedAreas.includes(vendor.location)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{vendor.location}</div>
                    <div className="text-sm text-gray-600">{vendor.address}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {vendor.area_type === 'mainland' ? '🏢 Mainland' : '🏝️ Island'}
                    </div>
                  </div>
                  {selectedAreas.includes(vendor.location) && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            {/* None of these option */}
            <button
              onClick={() => setShowFallbackOptions(!showFallbackOptions)}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                showFallbackOptions ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">None of these are close to me</div>
              <div className="text-sm text-gray-600">Choose general area instead</div>
            </button>
            
            {showFallbackOptions && (
              <div className="ml-4 space-y-2">
                <button
                  onClick={() => {
                    setSelectedAreas(['Ikeja', 'Yaba', 'Airport Road']);
                    setShowFallbackOptions(false);
                  }}
                  className="w-full p-2 rounded border border-gray-300 text-left hover:bg-gray-50"
                >
                  <span className="font-medium">Lagos Mainland</span>
                  <span className="text-sm text-gray-600 ml-2">(Ikeja, Yaba, Airport Road)</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAreas(['Lagos Island', 'Lekki', 'Ajah']);
                    setShowFallbackOptions(false);
                  }}
                  className="w-full p-2 rounded border border-gray-300 text-left hover:bg-gray-50"
                >
                  <span className="font-medium">Lagos Island</span>
                  <span className="text-sm text-gray-600 ml-2">(Lagos Island, Lekki, Ajah)</span>
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Delivery Address Input */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Your Delivery Address
          </h3>
          
          {prefilledAddress && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium flex items-center mb-2">
                <MapPin size={12} className="mr-1" />
                Auto-filled from your profile
              </p>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="font-medium text-gray-900">{prefilledAddress.label}</p>
                <p className="text-gray-700">{prefilledAddress.street}</p>
                <p className="text-gray-700">{prefilledAddress.city}, {prefilledAddress.state}</p>
                {prefilledAddress.landmark && (
                  <p className="text-sm text-gray-500">Near: {prefilledAddress.landmark}</p>
                )}
              </div>
            </div>
          )}

          {!showAddNewAddress ? (
            <Button
              onClick={() => setShowAddNewAddress(true)}
              variant="outline"
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              {prefilledAddress ? 'Use Different Address' : 'Add Delivery Address'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Full delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button onClick={() => setShowAddNewAddress(false)} className="flex-1">Use This Address</Button>
                <Button onClick={() => setShowAddNewAddress(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Contact Information */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Phone size={20} className="mr-2 text-gray-600" />
            Contact Information
          </h3>
          
          {prefilledContact && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium flex items-center mb-2">
                <Phone size={12} className="mr-1" />
                Auto-filled from your profile
              </p>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="font-medium text-gray-900">{prefilledContact.label}</p>
                <p className="text-sm text-gray-600">Phone: {prefilledContact.phone_number}</p>
                <p className="text-sm text-gray-600">WhatsApp: {prefilledContact.whatsapp_number}</p>
              </div>
            </div>
          )}

          {!showAddNewContact ? (
            <Button
              onClick={() => setShowAddNewContact(true)}
              variant="outline"
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add New Contact
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Contact label (e.g., Personal, Work)"
                value={newContact.label}
                onChange={(e) => setNewContact(prev => ({ ...prev, label: e.target.value }))}
              />
              <Input
                placeholder="Phone number"
                value={newContact.phone_number}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone_number: e.target.value }))}
              />
              <Input
                placeholder="WhatsApp number"
                value={newContact.whatsapp_number}
                onChange={(e) => setNewContact(prev => ({ ...prev, whatsapp_number: e.target.value }))}
              />
              <div className="flex space-x-2">
                <Button onClick={saveNewContact} className="flex-1">Save Contact</Button>
                <Button onClick={() => setShowAddNewContact(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Date & Time Selection */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar size={20} className="mr-2 text-gray-600" />
            Delivery Date & Time
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Time *</label>
              <div className="grid grid-cols-1 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setSelectedTime(slot.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedTime === slot.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-gray-600" />
                      <span className="font-medium text-gray-900">{slot.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={() => navigate('/premium-cash-delivery-payment', {
            state: {
              selectedAreas,
              deliveryAddress,
              selectedContact: selectedContact || prefilledContact,
              selectedDate,
              selectedTime
            }
          })}
          disabled={selectedAreas.length === 0 || !deliveryAddress || !(selectedContact || prefilledContact) || !selectedDate || !selectedTime}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default PremiumCashDelivery;