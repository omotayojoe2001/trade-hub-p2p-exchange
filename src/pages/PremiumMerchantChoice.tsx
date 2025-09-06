import React, { useState } from 'react';
import { ArrowLeft, Zap, Users, Star, Clock, Shield, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePremium } from '@/hooks/usePremium';

const PremiumMerchantChoice = () => {
  const [selectedOption, setSelectedOption] = useState<'auto' | 'manual' | ''>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium } = usePremium();
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center">
          <Crown size={20} className="mr-2" />
          <h1 className="text-lg font-semibold">
            Premium Merchant Matching
          </h1>
        </div>
      </div>

      <div className="p-4">
        {/* Premium Banner */}
        <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Crown size={16} className="text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Premium Merchant Selection</p>
              <p>As a premium member, you get priority access to the best merchants with enhanced matching options.</p>
            </div>
          </div>
        </div>

        {/* Auto Matching Option */}
        <Card 
          className={`mb-4 cursor-pointer transition-all ${
            selectedOption === 'auto' 
              ? 'ring-2 ring-yellow-500 bg-yellow-50' 
              : 'hover:shadow-md'
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
                  <h3 className="text-lg font-semibold text-gray-900">Premium Auto Match</h3>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Crown size={12} className="mr-1" />
                    Premium
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  AI-powered matching finds the absolute best merchants for premium members:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Top-rated merchants with 99%+ completion rate</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Premium priority - under 60 seconds</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Enhanced security and guaranteed rates</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚡ Premium Fast Track - Priority matching within 30 seconds
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
              : 'hover:shadow-md'
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Premium Manual Selection
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Browse premium-verified merchants with detailed analytics:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>Access to all premium-verified merchants</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Advanced merchant analytics & history</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Real-time rates and availability</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 font-medium">
                    🎯 Premium Control - Choose from our best-rated merchants
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Summary */}
        {(amount || nairaAmount) && (
          <Card className="mb-6 bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Crown size={16} className="mr-2 text-yellow-500" />
                Premium Trade Summary
              </h4>
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
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span>Premium Benefits:</span>
                  <span className="font-medium text-yellow-600">Enhanced Security & Priority</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedOption}
          className="w-full h-12 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-lg"
        >
          {selectedOption === 'auto' ? '⚡ Start Premium Auto-Match' : selectedOption === 'manual' ? '🎯 Browse Premium Merchants' : 'Select an Option'}
        </Button>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Premium members get access to verified merchants and priority matching
        </p>
      </div>
    </div>
  );
};

export default PremiumMerchantChoice;