
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SelectMerchantPopup from '../components/SelectMerchantPopup';

const BuySell = () => {
  const [buyFastProcessing, setBuyFastProcessing] = useState(false);
  const [sellSecureEscrow, setSellSecureEscrow] = useState(false);
  const [notSureChecked, setNotSureChecked] = useState(false);
  const [showMerchantPopup, setShowMerchantPopup] = useState(false);

  const handleSellStart = () => {
    setShowMerchantPopup(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins' }}>
          Buy or Sell Crypto
        </h1>
        <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
          Start a new trade by choosing what you want to do.
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-6 mb-6">
        {/* Buy Card */}
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <div className="mb-3">
            <h3 className="text-lg font-medium text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>
              Buy Crypto
            </h3>
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
              Send 🇳🇬, Receive BTC/USDT
            </p>
          </div>
          
          <p className="text-xs italic text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
            You have Naira, want to get crypto
          </p>
          
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="buy-fast"
              checked={buyFastProcessing}
              onCheckedChange={(checked) => setBuyFastProcessing(checked as boolean)}
            />
            <label htmlFor="buy-fast" className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
              Fast processing
            </label>
          </div>
          
          <Button className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl" style={{ fontFamily: 'Poppins' }}>
            Start
          </Button>
        </Card>

        {/* Sell Card */}
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <div className="mb-3">
            <h3 className="text-lg font-medium text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>
              Sell Crypto
            </h3>
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
              Send BTC/USDT, Receive 🇳🇬
            </p>
          </div>
          
          <p className="text-xs italic text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
            You have crypto, want to get cash
          </p>
          
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="sell-escrow"
              checked={sellSecureEscrow}
              onCheckedChange={(checked) => setSellSecureEscrow(checked as boolean)}
            />
            <label htmlFor="sell-escrow" className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
              Secure escrow
            </label>
          </div>
          
          <Button 
            className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl" 
            style={{ fontFamily: 'Poppins' }}
            onClick={handleSellStart}
          >
            Start
          </Button>
        </Card>
      </div>

      {/* Helper Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="not-sure"
            checked={notSureChecked}
            onCheckedChange={(checked) => setNotSureChecked(checked as boolean)}
          />
          <label htmlFor="not-sure" className="text-xs italic text-gray-500" style={{ fontFamily: 'Inter' }}>
            Not sure? Tap Buy if you're funding with Naira.
          </label>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-blue-500" style={{ fontFamily: 'Inter' }}>
            How Escrow Works? &gt;
          </p>
        </div>
      </div>

      {/* Active Trade Section */}
      <Card className="p-4 bg-white rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>
          Trade in Progress
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
            Started 1 hour ago
          </p>
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded" style={{ fontFamily: 'Inter' }}>
            Pending
          </span>
        </div>

        {/* Trade Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2">
            <div className="grid grid-cols-3 gap-4">
              <p className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Inter' }}>Type</p>
              <p className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Inter' }}>Amount</p>
              <p className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Inter' }}>Value</p>
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="grid grid-cols-3 gap-4">
              <p className="text-sm text-gray-800" style={{ fontFamily: 'Inter' }}>Selling BTC</p>
              <p className="text-sm text-gray-800" style={{ fontFamily: 'Inter' }}>0.0045 BTC</p>
              <p className="text-sm text-gray-800" style={{ fontFamily: 'Inter' }}>₦125,000</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-sm font-medium text-blue-500" style={{ fontFamily: 'Inter' }}>
              Waiting for merchant to pay
            </p>
          </div>
        </div>
      </Card>

      {/* Select Merchant Popup */}
      <SelectMerchantPopup 
        isOpen={showMerchantPopup}
        onClose={() => setShowMerchantPopup(false)}
      />
    </div>
  );
};

export default BuySell;
