import React, { useState } from 'react';
import { ArrowLeft, Zap, Users, Star, Clock, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MerchantMatchingChoice = () => {
  const [selectedOption, setSelectedOption] = useState<'auto' | 'manual' | ''>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { coinType, mode, amount, nairaAmount, selectedCoin, coinData } = location.state || {};

  const handleContinue = () => {
    if (!selectedOption) return;

    if (selectedOption === 'auto') {
      // Auto-match: Find best merchant automatically
      navigate('/auto-merchant-match', {
        state: {
          coinType,
          mode,
          amount,
          nairaAmount,
          selectedCoin,
          coinData,
          matchingType: 'auto'
        }
      });
    } else {
      // Manual: Show merchant list for user selection
      navigate('/merchant-list', {
        state: {
          coinType,
          mode,
          amount,
          nairaAmount,
          selectedCoin,
          coinData,
          matchingType: 'manual'
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate('/select-coin', { state: { mode } })} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          Choose Merchant Matching
        </h1>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield size={16} className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How would you like to find a merchant?</p>
              <p>Choose between automatic matching for speed or manual selection for control.</p>
            </div>
          </div>
        </div>

        {/* Auto Matching Option */}
        <Card 
          className={`mb-4 cursor-pointer transition-all ${
            selectedOption === 'auto' 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedOption('auto')}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                selectedOption === 'auto' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Zap className={`w-6 h-6 ${
                  selectedOption === 'auto' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Auto Match</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Recommended
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  We'll automatically find the best merchant for you based on:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Highest rating and reputation</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Fastest response time</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>Best available rates</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">
                      Fastest option - Usually matches within 30 seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Selection Option */}
        <Card 
          className={`mb-6 cursor-pointer transition-all ${
            selectedOption === 'manual' 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedOption('manual')}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                selectedOption === 'manual' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Users className={`w-6 h-6 ${
                  selectedOption === 'manual' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Manual Selection
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Browse and choose from available merchants yourself:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>View all available merchants</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Compare ratings and reviews</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Check response times and rates</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-800 font-medium">
                      Full control - Choose exactly who you want to trade with
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Summary */}
        {(amount || nairaAmount) && (
          <Card className="mb-6 bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2">Trade Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{mode === 'buy' ? 'Buy' : 'Sell'} {coinType}</span>
                </div>
                {amount && (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{amount} {coinType}</span>
                  </div>
                )}
                {nairaAmount && (
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span className="font-medium">₦{parseFloat(nairaAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedOption}
          className="w-full h-12 bg-[#1A73E8] hover:bg-[#1557b0] text-white font-semibold rounded-lg"
        >
          {selectedOption === 'auto' ? 'Find Best Merchant' : selectedOption === 'manual' ? 'Browse Merchants' : 'Select an Option'}
        </Button>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          You can always switch between auto and manual matching in your settings
        </p>
      </div>
    </div>
  );
};

export default MerchantMatchingChoice;
