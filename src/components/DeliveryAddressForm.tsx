import React, { useState, useEffect } from 'react';
import { Home, Phone, MapPin, Navigation } from 'lucide-react';
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
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [landmark, setLandmark] = useState('');

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

      // Auto-prefill if we have profile data
      if (phone && !phoneNumber) {
        onPhoneChange(phone);
      }
      if (address && !deliveryAddress) {
        onAddressChange(address);
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

  // Auto-fill on component mount if profile data is available
  useEffect(() => {
    if (!loading && useProfileAddress) {
      if (profilePhone && !phoneNumber) {
        onPhoneChange(profilePhone);
      }
      if (profileAddress && !deliveryAddress) {
        onAddressChange(profileAddress);
      }
    }
  }, [loading, profilePhone, profileAddress, useProfileAddress, phoneNumber, deliveryAddress, onPhoneChange, onAddressChange]);

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
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Navigation size={16} className="mr-2" />
          State <span className="text-red-500 ml-1">*</span>
        </label>
        
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select State</option>
          <option value="Lagos">Lagos</option>
          <option value="Abuja">Abuja (FCT)</option>
          <option value="Ogun">Ogun</option>
          <option value="Rivers">Rivers</option>
          <option value="Kano">Kano</option>
          <option value="Kaduna">Kaduna</option>
          <option value="Oyo">Oyo</option>
          <option value="Delta">Delta</option>
          <option value="Edo">Edo</option>
          <option value="Anambra">Anambra</option>
          <option value="Imo">Imo</option>
          <option value="Enugu">Enugu</option>
          <option value="Abia">Abia</option>
          <option value="Cross River">Cross River</option>
          <option value="Akwa Ibom">Akwa Ibom</option>
          <option value="Plateau">Plateau</option>
          <option value="Kwara">Kwara</option>
          <option value="Osun">Osun</option>
          <option value="Niger">Niger</option>
          <option value="Ekiti">Ekiti</option>
          <option value="Ondo">Ondo</option>
          <option value="Kogi">Kogi</option>
          <option value="Benue">Benue</option>
          <option value="Taraba">Taraba</option>
          <option value="Adamawa">Adamawa</option>
          <option value="Borno">Borno</option>
          <option value="Yobe">Yobe</option>
          <option value="Gombe">Gombe</option>
          <option value="Bauchi">Bauchi</option>
          <option value="Jigawa">Jigawa</option>
          <option value="Katsina">Katsina</option>
          <option value="Zamfara">Zamfara</option>
          <option value="Sokoto">Sokoto</option>
          <option value="Kebbi">Kebbi</option>
          <option value="Nasarawa">Nasarawa</option>
          <option value="Ebonyi">Ebonyi</option>
          <option value="Bayelsa">Bayelsa</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <MapPin size={16} className="mr-2" />
          Closest Landmark or Location <span className="text-red-500 ml-1">*</span>
        </label>
        
        <input
          type="text"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="e.g., Near Shoprite, Victoria Island"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Full Address <span className="text-red-500 ml-1">*</span></label>
        
        <textarea
          value={deliveryAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Enter your complete delivery address with house number and street"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          required
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Phone size={16} className="mr-2" />
          Phone Number <span className="text-red-500 ml-1">*</span>
        </label>
        
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+234..."
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-700">
          <strong>Note:</strong> Service fees will be calculated based on distance from vendor to your location once a vendor accepts your trade.
        </p>
      </div>
    </div>
  );
};

export default DeliveryAddressForm;