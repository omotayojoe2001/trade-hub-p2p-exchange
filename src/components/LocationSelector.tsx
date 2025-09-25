import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationChange
}) => {
  const [customLocation, setCustomLocation] = useState('');

  const predefinedLocations = [
    'Victoria Island, Lagos',
    'Ikeja, Lagos', 
    'Lekki, Lagos',
    'Surulere, Lagos',
    'Abuja CBD',
    'Garki, Abuja',
    'Wuse, Abuja',
    'Port Harcourt, Rivers',
    'Other (specify below)'
  ];

  const handleLocationSelect = (location: string) => {
    console.log('Location selected:', location);
    if (location === 'Other (specify below)') {
      onLocationChange('Other (specify below)');
      setCustomLocation('');
    } else {
      onLocationChange(location);
      setCustomLocation('');
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <MapPin size={16} className="mr-2" />
        Select Pickup Location
      </label>
      
      <div className="space-y-2">
        {predefinedLocations.map((location) => (
          <div
            key={location}
            onClick={() => handleLocationSelect(location)}
            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedLocation === location || (location === 'Other (specify below)' && !predefinedLocations.includes(selectedLocation) && selectedLocation !== '')
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="pickup-location"
              value={location}
              checked={selectedLocation === location || (location === 'Other (specify below)' && !predefinedLocations.includes(selectedLocation) && selectedLocation !== '')}
              onChange={() => handleLocationSelect(location)}
              className="mr-3 w-4 h-4 text-blue-600 pointer-events-none"
            />
            <span className="text-sm text-gray-900 font-medium">{location}</span>
          </div>
        ))}
      </div>

      {(selectedLocation === 'Other (specify below)' || (!predefinedLocations.includes(selectedLocation) && selectedLocation !== '')) && (
        <div className="mt-3">
          <input
            type="text"
            value={selectedLocation === 'Other (specify below)' ? customLocation : selectedLocation}
            onChange={(e) => {
              setCustomLocation(e.target.value);
              onLocationChange(e.target.value);
            }}
            placeholder="Enter your preferred pickup location"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
};

export default LocationSelector;