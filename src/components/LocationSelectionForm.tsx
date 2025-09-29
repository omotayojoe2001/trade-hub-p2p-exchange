import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { countries, Country, State } from '@/data/countries';

interface LocationSelectionFormProps {
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

const LocationSelectionForm: React.FC<LocationSelectionFormProps> = ({
  selectedCountry,
  selectedState,
  selectedCity,
  onCountryChange,
  onStateChange,
  onCityChange
}) => {
  const currentCountry = countries.find(c => c.code === selectedCountry);
  const availableStates = currentCountry?.states || [];

  const handleCountryChange = (countryCode: string) => {
    onCountryChange(countryCode);
    onStateChange(''); // Reset state when country changes
    onCityChange(''); // Reset city when country changes
  };

  const handleStateChange = (stateCode: string) => {
    onStateChange(stateCode);
    onCityChange(''); // Reset city when state changes
  };

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center">
          <Globe size={16} className="mr-2" />
          Country
        </Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
            <SelectValue placeholder="Select your country" className="text-gray-700" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code} className="py-3 px-4 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State Selection */}
      {selectedCountry && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center">
            <MapPin size={16} className="mr-2" />
            State/Region
          </Label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
              <SelectValue placeholder="Select your state/region" className="text-gray-700" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {availableStates.map((state) => (
                <SelectItem key={state.code} value={state.code} className="py-3 px-4 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{state.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* City Input */}
      {selectedState && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            City/Local Area
          </Label>
          <Input
            type="text"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="h-12 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all px-4"
            placeholder="Enter your city or local area"
          />
        </div>
      )}
    </div>
  );
};

export default LocationSelectionForm;