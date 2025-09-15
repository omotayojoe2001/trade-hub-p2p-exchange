import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, MapPin, Phone, Star, Plus, Calendar, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const PremiumCashPickup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [prefilledContact, setPrefilledContact] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showAddNewContact, setShowAddNewContact] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const timeSlots = [
    { value: 'morning', label: '9:00 AM - 12:00 PM' },
    { value: 'afternoon', label: '12:00 PM - 4:00 PM' },
    { value: 'evening', label: '4:00 PM - 7:00 PM' }
  ];

  useEffect(() => {
    loadVendors();
    loadPrefilledContact();
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

  const loadPrefilledContact = async () => {
    if (!user) return;
    try {
      // Load user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile && profile.phone_number) {
        const contactFromProfile = {
          id: 'profile-contact',
          phone_number: profile.phone_number,
          whatsapp_number: profile.phone_number,
          label: 'Profile Contact'
        };
        setPrefilledContact(contactFromProfile);
        setPhoneNumber(profile.phone_number);
        setWhatsappNumber(profile.phone_number);
      }
    } catch (error) {
      console.error('Error loading contact:', error);
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
                Premium Cash Pickup
              </h1>
              <p className="text-gray-600 text-sm">Select vendor and contact info</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Vendor Selection */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Select Vendor Location
          </h3>
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedVendor?.id === vendor.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center">
                      {vendor.name}
                      <div className="ml-2 flex items-center">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{vendor.rating}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{vendor.location}</div>
                    <div className="text-xs text-gray-500">{vendor.address}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
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
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Input
                placeholder="WhatsApp Number"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button onClick={() => setShowAddNewContact(false)} className="flex-1">Done</Button>
                <Button onClick={() => setShowAddNewContact(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Date & Time Selection */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar size={20} className="mr-2 text-gray-600" />
            Pickup Date & Time
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
          onClick={() => navigate('/premium-cash-pickup-payment', {
            state: {
              selectedVendor,
              phoneNumber,
              whatsappNumber,
              selectedDate,
              selectedTime
            }
          })}
          disabled={!selectedVendor || !phoneNumber || !whatsappNumber || !selectedDate || !selectedTime}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default PremiumCashPickup;