
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MerchantSelection = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedOption === 'auto') {
      // Navigate to auto-match flow
      console.log('Auto-match selected');
    } else if (selectedOption === 'manual') {
      // Navigate to coin selection page
      navigate('/select-coin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4">
        <Link to="/buy-sell" className="mr-4">
          <ArrowLeft size={24} className="text-white" />
        </Link>
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-2">Sell BTC/USDT</h1>
          <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">?</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Choose How You Want to Be Matched</h2>
          <p className="text-gray-400 text-sm">
            Select how you'd prefer to connect with a verified merchant for this transaction.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {/* Auto-Match Option */}
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedOption === 'auto' 
                ? 'border-green-500 bg-gray-800' 
                : 'border-gray-600 bg-gray-800'
            }`}
            onClick={() => setSelectedOption('auto')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-lg font-semibold text-white mr-2">Auto-Match</h3>
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Let the platform connect you with a fast, trusted merchant
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                selectedOption === 'auto' 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-400'
              }`}>
                {selectedOption === 'auto' && (
                  <div className="w-full h-full rounded-full bg-green-500"></div>
                )}
              </div>
            </div>
            <div className="space-y-2 ml-15">
              <div className="flex items-center text-sm text-yellow-400">
                <span className="mr-2">⭐</span>
                <span>Based on rates, trust score, and speed</span>
              </div>
              <div className="flex items-center text-sm text-green-400">
                <span className="mr-2">🕐</span>
                <span>~2-5 minutes</span>
              </div>
            </div>
          </div>

          {/* Manual Select Option */}
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedOption === 'manual' 
                ? 'border-blue-500 bg-gray-800' 
                : 'border-gray-600 bg-gray-800'
            }`}
            onClick={() => setSelectedOption('manual')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Manual Select</h3>
                  <p className="text-gray-300 text-sm">
                    Browse and choose your preferred merchant
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                selectedOption === 'manual' 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-400'
              }`}>
                {selectedOption === 'manual' && (
                  <div className="w-full h-full rounded-full bg-blue-500"></div>
                )}
              </div>
            </div>
            <div className="space-y-2 ml-15">
              <div className="flex items-center text-sm text-blue-400">
                <span className="mr-2">🔍</span>
                <span>View merchant rates, ratings, and response time</span>
              </div>
              <div className="flex items-center text-sm text-blue-400">
                <span className="mr-2">🕐</span>
                <span>~5-15 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gray-800 border border-yellow-500 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <span className="text-yellow-500 mr-3 mt-1">💡</span>
            <p className="text-gray-300 text-sm">
              You are transacting peer-to-peer. Your crypto is escrowed for safety and will only be released when both parties confirm. Always review merchant ratings before choosing.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <Button 
          className={`w-full h-12 rounded-lg text-white font-semibold ${
            selectedOption 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
          onClick={handleContinue}
          disabled={!selectedOption}
        >
          Continue
        </Button>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 text-sm hover:text-white">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MerchantSelection;
