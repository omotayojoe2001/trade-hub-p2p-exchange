
import React, { useState } from 'react';
import { Bell, ArrowUpRight, ArrowDownLeft, HelpCircle, Clock, Shield, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';

const BuySell = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { isQuickAuthActive } = useQuickAuth();
  const navigate = useNavigate();

  const handleSellCrypto = () => {
    navigate('/select-coin');
  };

  const handleBuyCrypto = () => {
    navigate('/buy-crypto-flow');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">CryptoTrade</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/trade-requests')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <List size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
          </button>
          <div className="relative">
            <Bell size={24} className="text-gray-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="p-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buy or Sell Crypto</h1>
        <p className="text-gray-600">Start a new trade by choosing what you want to do.</p>
      </div>

      {/* Trade Options */}
      <div className="p-4 space-y-4">
        {/* Buy Crypto Card */}
        <div 
          className={`bg-white rounded-xl p-4 border border-gray-200 cursor-pointer transition-all duration-200 ${
            hoveredCard === 'buy' ? 'shadow-lg border-blue-300 transform scale-105' : 'hover:shadow-md'
          }`}
          onMouseEnter={() => setHoveredCard('buy')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={handleBuyCrypto}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 transition-colors ${
                hoveredCard === 'buy' ? 'bg-blue-200' : ''
              }`}>
                <ArrowUpRight size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-blue-600 mb-1 transition-colors ${
                  hoveredCard === 'buy' ? 'text-blue-700' : ''
                }`}>Buy Crypto</h3>
                <p className="text-gray-600 text-sm mb-1">Send ₦, Receive BTC/USDT</p>
                <p className="text-gray-500 text-xs">You have Naira, want to get crypto</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <HelpCircle size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 text-sm">
              <Clock size={14} className="mr-1" />
              <span>Fast processing</span>
            </div>
            <Button className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all ${
              hoveredCard === 'buy' ? 'bg-blue-600 shadow-md' : ''
            }`}>
              Start
            </Button>
          </div>
        </div>

        {/* Sell Crypto Card */}
        <div 
          className={`bg-white rounded-xl p-4 border border-gray-200 cursor-pointer transition-all duration-200 ${
            hoveredCard === 'sell' ? 'shadow-lg border-green-300 transform scale-105' : 'hover:shadow-md'
          }`}
          onMouseEnter={() => setHoveredCard('sell')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={handleSellCrypto}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className={`w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 transition-colors ${
                hoveredCard === 'sell' ? 'bg-green-200' : ''
              }`}>
                <ArrowDownLeft size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-gray-900 mb-1 transition-colors ${
                  hoveredCard === 'sell' ? 'text-green-700' : ''
                }`}>Sell Crypto</h3>
                <p className="text-gray-600 text-sm mb-1">Send BTC/USDT, Receive ₦</p>
                <p className="text-gray-500 text-xs">You have crypto, want to get cash</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <HelpCircle size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500 text-sm">
              <Shield size={14} className="mr-1" />
              <span>Secure escrow</span>
            </div>
            <Button 
              variant="outline" 
              className={`border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-all ${
                hoveredCard === 'sell' ? 'border-green-300 bg-green-50 text-green-700' : ''
              }`}
            >
              Start
            </Button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mx-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-white text-xs">💡</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 text-sm mb-2">
                <span className="font-medium">Not sure? Tap Buy if you're funding with Naira.</span>
              </p>
              <button className="text-blue-600 text-sm font-medium">
                How Escrow Works? →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trade in Progress */}
      <div className="mx-4 mb-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">⚡</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Trade in Progress</h4>
                <p className="text-gray-600 text-sm">Started 1 hour ago</p>
              </div>
            </div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
              Pending
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">Type</p>
              <p className="font-medium text-gray-900 text-sm">Selling BTC</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Amount</p>
              <p className="font-medium text-gray-900 text-sm">0.0045 BTC</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Value</p>
              <p className="font-medium text-gray-900 text-sm">₦125,000</p>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            <span>Waiting for merchant to pay</span>
          </div>
          
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium">
            🔍 Resume Trade
          </Button>
        </div>
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default BuySell;
