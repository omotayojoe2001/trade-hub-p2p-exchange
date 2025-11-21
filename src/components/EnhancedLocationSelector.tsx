import React, { useState } from 'react';
import { MapPin, Globe, Check, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { countries, Country, State } from '@/data/countries';

interface EnhancedLocationSelectorProps {
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

const getCountryFlag = (countryCode: string) => {
  const flags: Record<string, string> = {
    'NG': '🇳🇬',
    'GH': '🇬🇭', 
    'KE': '🇰🇪',
    'ZA': '🇿🇦',
    'UG': '🇺🇬',
    'US': '🇺🇸',
    'GB': '🇬🇧'
  };
  return flags[countryCode] || '🌍';
};

const EnhancedLocationSelector: React.FC<EnhancedLocationSelectorProps> = ({
  selectedCountry,
  selectedState,
  selectedCity,
  onCountryChange,
  onStateChange,
  onCityChange
}) => {
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  const currentCountry = countries.find(c => c.code === selectedCountry);
  const availableStates = currentCountry?.states || [];

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredStates = availableStates.filter(state =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const handleCountrySelect = (countryCode: string) => {
    onCountryChange(countryCode);
    onStateChange('');
    onCityChange('');
    setShowCountryDialog(false);
    setCountrySearch('');
  };

  const handleStateSelect = (stateCode: string) => {
    onStateChange(stateCode);
    onCityChange('');
    setShowStateDialog(false);
    setStateSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800 flex items-center">
          <Globe size={16} className="mr-2" />
          Country
        </label>
        <button
          type="button"
          onClick={() => setShowCountryDialog(true)}
          className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-3">
            {selectedCountry ? (
              <>
                <span className="text-2xl">{getCountryFlag(selectedCountry)}</span>
                <span className="font-medium text-white">{currentCountry?.name}</span>
              </>
            ) : (
              <span className="text-white">Select your country</span>
            )}
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* State Selection */}
      {selectedCountry && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <MapPin size={16} className="mr-2" />
            State/Region
          </label>
          <button
            type="button"
            onClick={() => setShowStateDialog(true)}
            className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-3">
              {selectedState ? (
                <span className="font-medium text-white">
                  {availableStates.find(s => s.code === selectedState)?.name}
                </span>
              ) : (
                <span className="text-white">Select your state/region</span>
              )}
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      )}

      {/* City Input */}
      {selectedState && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800">
            City/Local Area
          </label>
          <Input
            type="text"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="h-12 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all px-4"
            placeholder="Enter your city or local area"
          />
        </div>
      )}

      {/* Country Selection Dialog */}
      <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Select Country</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pb-4">
            <Input
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCountries.map((country) => {
              const isNigeria = country.code === 'NG';
              return (
                <button
                  key={country.code}
                  onClick={() => isNigeria ? handleCountrySelect(country.code) : null}
                  className={`w-full px-6 py-4 transition-colors flex items-center justify-between text-left border-b border-gray-100 last:border-b-0 ${
                    isNigeria ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCountryFlag(country.code)}</span>
                    <span className={`font-medium ${
                      isNigeria ? 'text-white' : 'text-gray-400'
                    }`}>
                      {country.name}
                      {!isNigeria && ' (Not Available)'}
                    </span>
                  </div>
                  {selectedCountry === country.code && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* State Selection Dialog */}
      <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Select State/Region</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pb-4">
            <Input
              placeholder="Search states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredStates.map((state) => (
              <button
                key={state.code}
                onClick={() => handleStateSelect(state.code)}
                className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between text-left border-b border-gray-100 last:border-b-0"
              >
                <span className="font-medium text-white">{state.name}</span>
                {selectedState === state.code && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedLocationSelector;