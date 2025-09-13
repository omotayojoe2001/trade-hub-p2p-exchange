import React, { useState } from 'react';
import { ArrowLeft, Zap, Users, Star, Clock, Shield, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumMerchantMatchingChoice = () => {
  const [selectedOption, setSelectedOption] = useState<'auto' | 'manual' | ''>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { coinType, mode, amount, nairaAmount, selectedCoin, coinData } = location.state || {};

  const handleContinue = () => {
    if (!selectedOption) return;

    if (selectedOption === 'auto') {
      navigate('/premium-auto-merchant-match', {
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
      navigate('/premium-merchant-list', {
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate('/premium-select-coin', { state: { mode } })} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center">
          <Crown size={20} className="text-gray-600 mr-2" />
          <h1 className="text-lg font-semibold text-gray-900">
            Premium Merchant Matching
          </h1>
        </div>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield size={16} className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1 flex items-center">
                <Crown size={14} className="mr-1" />
                Premium Merchant Matching
              </p>
              <p>Choose between AI-powered auto-matching or manual selection with premium merchants.</p>
            </div>
          </div>
        </div>

        {/* Auto Matching Option */}
        <Card 
          className={`mb-4 cursor-pointer transition-all ${
            selectedOption === 'auto' 
              ? 'ring-2 ring-yellow-500 bg-yellow-50' 
              : 'hover:shadow-md bg-white/90'
          }`}
          onClick={() => setSelectedOption('auto')}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                selectedOption === 'auto' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <Zap className={`w-6 h-6 ${
                  selectedOption === 'auto' ? 'text-yellow-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown size={16} className="text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-900">Premium Auto Match</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    AI Powered
                  </Badge>
                </div>
                <p className="text-yellow-700 text-sm mb-3">
                  Our AI automatically finds the best premium merchant for you based on:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Highest premium merchant ratings</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Fastest premium response times</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>Exclusive premium rates</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium flex items-center">
                    <Crown size={14} className="mr-1" />
                    Premium Speed - Usually matches within 15 seconds
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Selection Option */}
        <Card 
          className={`mb-6 cursor-pointer transition-all ${
            selectedOption === 'manual' 
              ? 'ring-2 ring-yellow-500 bg-yellow-50' 
              : 'hover:shadow-md bg-white/90'
          }`}
          onClick={() => setSelectedOption('manual')}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                selectedOption === 'manual' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <Users className={`w-6 h-6 ${
                  selectedOption === 'manual' ? 'text-yellow-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown size={16} className="text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-900">Premium Manual Selection</h3>
                </div>
                <p className="text-yellow-700 text-sm mb-3">
                  Browse and choose from verified premium merchants:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>View all premium merchants</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Compare premium ratings and reviews</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-yellow-700">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Check exclusive premium rates</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-100 to-yellow-100 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium flex items-center">
                    <Crown size={14} className="mr-1" />
                    Premium Control - Choose your preferred merchant
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Summary */}
        {(amount || nairaAmount) && (
          <Card className="mb-6 bg-white/90 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                <Crown size={16} className="mr-2" />
                Premium Trade Summary
              </h4>
              <div className="space-y-1 text-sm text-yellow-700">
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
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
        >
          <Crown size={16} className="mr-2" />
          {selectedOption === 'auto' ? 'Find Best Premium Merchant' : selectedOption === 'manual' ? 'Browse Premium Merchants' : 'Select an Option'}
        </Button>

        {/* Help Text */}
        <p className="text-center text-sm text-yellow-600 mt-4">
          Premium members get priority access to the best merchants and rates
        </p>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumMerchantMatchingChoice;