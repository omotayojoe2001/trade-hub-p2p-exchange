import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BuyCryptoMerchantSelection = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { nairaAmount, btcAmount } = location.state || {};

  const handleContinue = () => {
    if (selectedOption === 'auto') {
      // Auto-match goes directly to merchant match with auto-matched merchant
      navigate('/buy-crypto-match', { 
        state: { 
          nairaAmount, 
          btcAmount,
          isAutoMatch: true 
        } 
      });
    } else if (selectedOption === 'manual') {
      // Manual selection goes to merchant list (future feature)
      navigate('/merchant-list', { 
        state: { 
          nairaAmount, 
          btcAmount,
          type: 'buy' 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}  
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} className="text-muted-foreground" />
        </button>
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-2">Buy Bitcoin</h1>
          <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
            <span className="text-muted-foreground text-xs">?</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Choose How You Want to Be Matched</h2>
          <p className="text-muted-foreground text-sm">
            Select how you'd prefer to connect with a verified merchant for this transaction.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {/* Auto-Match Option */}
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedOption === 'auto' 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border bg-card hover:shadow-sm'
            }`}
            onClick={() => setSelectedOption('auto')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-3">
                  <span className="text-primary-foreground text-xl">🤖</span>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-lg font-semibold mr-2">Auto-Match</h3>
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Let the platform connect you with a fast, trusted merchant
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedOption === 'auto' 
                  ? 'border-primary bg-primary' 
                  : 'border-muted-foreground'
              }`}>
                {selectedOption === 'auto' && (
                  <div className="w-full h-full rounded-full bg-primary"></div>
                )}
              </div>
            </div>
            <div className="space-y-2 ml-15">
              <div className="flex items-center text-sm text-primary">
                <span className="mr-2">⭐</span>
                <span>Based on rates, trust score, and speed</span>
              </div>
              <div className="flex items-center text-sm text-primary">
                <span className="mr-2">🕐</span>
                <span>~2-5 minutes</span>
              </div>
            </div>
          </div>

          {/* Manual Select Option */}
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedOption === 'manual' 
                ? 'border-secondary bg-secondary/5 shadow-md' 
                : 'border-border bg-card hover:shadow-sm'
            }`}
            onClick={() => setSelectedOption('manual')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mr-3">
                  <span className="text-secondary-foreground text-xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Manual Select</h3>
                  <p className="text-muted-foreground text-sm">
                    Browse and choose your preferred merchant
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedOption === 'manual' 
                  ? 'border-secondary bg-secondary' 
                  : 'border-muted-foreground'
              }`}>
                {selectedOption === 'manual' && (
                  <div className="w-full h-full rounded-full bg-secondary"></div>
                )}
              </div>
            </div>
            <div className="space-y-2 ml-15">
              <div className="flex items-center text-sm text-secondary">
                <span className="mr-2">🔍</span>
                <span>View merchant rates, ratings, and response time</span>
              </div>
              <div className="flex items-center text-sm text-secondary">
                <span className="mr-2">🕐</span>
                <span>~5-15 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 border rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <span className="text-primary mr-3 mt-1">💡</span>
            <p className="text-foreground text-sm">
              You are transacting peer-to-peer. Your payment is protected by our escrow system. Merchants are verified and rated by other users.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <Button 
          className={`w-full h-12 rounded-lg font-semibold transition-all ${
            !selectedOption && 'opacity-50 cursor-not-allowed'
          }`}
          onClick={handleContinue}
          disabled={!selectedOption}
        >
          Continue
        </Button>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')} 
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoMerchantSelection;