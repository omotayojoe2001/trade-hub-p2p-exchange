import React, { useState, useEffect } from 'react';
import { Home, Phone, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DeliveryAddressFormProps {
  deliveryAddress: string;
  phoneNumber: string;
  onAddressChange: (address: string) => void;
  onPhoneChange: (phone: string) => void;
}

const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
  deliveryAddress,
  phoneNumber,
  onAddressChange,
  onPhoneChange
}) => {
  const { user } = useAuth();
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user profile data including location information
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, city, state, country, location')
        .eq('user_id', user.id)
        .single();

      const phone = profile?.phone_number || '';
      // Build address from location fields
      const address = profile?.location || 
        [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || '';

      setProfilePhone(phone);
      setProfileAddress(address);

      // Pre-fill phone and address if available
      if (useProfileAddress) {
        if (phone) onPhoneChange(phone);
        if (address) onAddressChange(address);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseProfileToggle = (use: boolean) => {
    setUseProfileAddress(use);
    if (use) {
      if (profilePhone) onPhoneChange(profilePhone);
      if (profileAddress) onAddressChange(profileAddress);
    } else {
      onPhoneChange('');
      onAddressChange('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <Home size={16} className="mr-2" />
        Delivery Details
      </label>

      {(profilePhone || profileAddress) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Use Profile Information</h4>
              <div className="text-sm text-blue-700 space-y-1">
                {profileAddress && (
                  <div className="flex items-start">
                    <Home size={14} className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span className="break-words">{profileAddress}</span>
                  </div>
                )}
                {profilePhone && (
                  <div className="flex items-center">
                    <Phone size={14} className="mr-2 text-blue-600" />
                    <span>{profilePhone}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleUseProfileToggle(!useProfileAddress)}
              className={`ml-4 px-3 py-1 rounded text-xs font-medium transition-colors ${
                useProfileAddress 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-300'
              }`}
            >
              {useProfileAddress ? 'Using' : 'Use This'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Delivery Address</label>
        
        <textarea
          value={deliveryAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Enter your full delivery address"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Phone size={16} className="mr-2" />
          Phone Number
        </label>
        
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={useProfileAddress && profilePhone ? profilePhone : "+234..."}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={useProfileAddress && !!profilePhone}
        />
      </div>
    </div>
  );
};

export default DeliveryAddressForm;