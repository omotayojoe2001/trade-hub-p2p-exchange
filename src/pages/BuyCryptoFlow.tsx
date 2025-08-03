import React, { useState } from 'react';
import { ArrowLeft, Info, Shield, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

const BuyCryptoFlow = () => {
  const [nairaAmount, setNairaAmount] = useState("");
  const [btcAmount, setBtcAmount] = useState("");
  const navigate = useNavigate();

  // Mock exchange rate (₦1500 per $1, BTC at $30,000)
  const RATE = 1500; // NGN per USD
  const BTC_PRICE = 30000; // USD per BTC

  const handleNairaChange = (value: string) => {
    setNairaAmount(value);
    if (value) {
      const usdAmount = parseFloat(value) / RATE;
      const btc = usdAmount / BTC_PRICE;
      setBtcAmount(btc.toFixed(8));
    } else {
      setBtcAmount("");
    }
  };

  const handleBtcChange = (value: string) => {
    setBtcAmount(value);
    if (value) {
      const usdAmount = parseFloat(value) * BTC_PRICE;
      const naira = usdAmount * RATE;
      setNairaAmount(naira.toFixed(2));
    } else {
      setNairaAmount("");
    }
  };

  const handleContinue = () => {
    navigate('/buy-crypto-match', { 
      state: { 
        nairaAmount, 
        btcAmount,
        type: 'buy' 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Buy Bitcoin</h1>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info size={16} className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How buying works:</p>
              <p>1. Enter the amount you want to spend in Naira</p>
              <p>2. We'll match you with a verified merchant</p>
              <p>3. Transfer Naira to merchant's account</p>
              <p>4. Receive Bitcoin in your wallet after confirmation</p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <Card className="p-4 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You pay (Nigerian Naira)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={nairaAmount}
                  onChange={(e) => handleNairaChange(e.target.value)}
                  className="pl-8 text-lg h-12"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You receive (Bitcoin)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₿</span>
                <Input
                  type="number"
                  placeholder="0.00000000"
                  value={btcAmount}
                  onChange={(e) => handleBtcChange(e.target.value)}
                  className="pl-8 text-lg h-12"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Exchange Rate */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Exchange Rate</span>
            <span className="font-medium">1 BTC = ₦45,000,000</span>
          </div>
        </div>

        {/* Security Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Shield size={16} className="text-green-500 mr-2" />
            <span>Protected by secure escrow system</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="text-blue-500 mr-2" />
            <span>Average completion time: 15 minutes</span>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!nairaAmount || !btcAmount}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Find Merchant
        </Button>

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <span className="font-medium">Important:</span> Only transfer money to the merchant's account details provided in the next step. Never send to any other account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoFlow;