
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowUpRight, ArrowDownLeft, HelpCircle, Search } from 'lucide-react';

const BuySell = () => {
  const [buyFastProcessing, setBuyFastProcessing] = useState(false);
  const [sellSecureEscrow, setSellSecureEscrow] = useState(false);
  const navigate = useNavigate();

  const handleSellStart = () => {
    navigate('/merchant-selection');
  };

  const handleBuyStart = () => {
    navigate('/select-coin');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-lg font-semibold text-gray-800">CryptoTrade</span>
        </div>
        <div className="relative">
          <Bell size={24} className="text-gray-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Buy or Sell Crypto
          </h1>
          <p className="text-sm text-gray-600">
            Start a new trade by choosing what you want to do.
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 mb-6">
          {/* Buy Card */}
          <Card className="p-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-800 mr-2">Buy Crypto</h3>
                  <ArrowUpRight size={16} className="text-blue-500" />
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  Send ₦, Receive BTC/USDT
                </p>
                <p className="text-xs text-gray-400">
                  You have Naira, want to get crypto
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <HelpCircle size={16} className="text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="buy-fast"
                checked={buyFastProcessing}
                onCheckedChange={(checked) => setBuyFastProcessing(checked as boolean)}
              />
              <label htmlFor="buy-fast" className="text-sm text-gray-700">
                Fast processing
              </label>
            </div>
            
            <Button 
              onClick={handleBuyStart}
              className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
            >
              Start
            </Button>
          </Card>

          {/* Sell Card */}
          <Card className="p-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-800 mr-2">Sell Crypto</h3>
                  <ArrowDownLeft size={16} className="text-green-500" />
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  Send BTC/USDT, Receive ₦
                </p>
                <p className="text-xs text-gray-400">
                  You have crypto, want to get cash
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <HelpCircle size={16} className="text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="sell-escrow"
                checked={sellSecureEscrow}
                onCheckedChange={(checked) => setSellSecureEscrow(checked as boolean)}
              />
              <label htmlFor="sell-escrow" className="text-sm text-gray-700">
                Secure escrow
              </label>
            </div>
            
            <Button 
              onClick={handleSellStart}
              variant="outline"
              className="w-full h-10 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Start
            </Button>
          </Card>
        </div>

        {/* Helper Section */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-white text-xs">💡</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-2">
                Not sure? Tap Buy if you're funding with Naira.
              </p>
              <button className="text-sm text-blue-500 font-medium">
                How Escrow Works? →
              </button>
            </div>
          </div>
        </div>

        {/* Trade in Progress */}
        <Card className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs">⚡</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Trade in Progress</h3>
                <p className="text-xs text-gray-500">Started 1 hour ago</p>
              </div>
            </div>
            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Pending
            </span>
          </div>

          {/* Trade Details Table */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className="bg-gray-50 px-4 py-3 rounded-t-lg">
              <div className="grid grid-cols-3 gap-4">
                <p className="text-xs font-semibold text-gray-600">Type</p>
                <p className="text-xs font-semibold text-gray-600">Amount</p>
                <p className="text-xs font-semibold text-gray-600">Value</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="grid grid-cols-3 gap-4">
                <p className="text-sm text-gray-800">Selling BTC</p>
                <p className="text-sm text-gray-800">0.0045 BTC</p>
                <p className="text-sm text-gray-800">₦125,000</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center mb-4">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs">⏱</span>
            </div>
            <p className="text-sm text-gray-700">Waiting for merchant to pay</p>
          </div>

          {/* Resume Button */}
          <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg">
            <Search size={16} className="mr-2" />
            Resume Trade
          </Button>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">🏠</div>
            <span className="text-xs text-gray-600">Home</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">🔄</div>
            <span className="text-xs text-blue-500 font-medium">Buy/Sell</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">📊</div>
            <span className="text-xs text-gray-600">My Trades</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">💰</div>
            <span className="text-xs text-gray-600">Transactions</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">⚙️</div>
            <span className="text-xs text-gray-600">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySell;
