import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Filter, MapPin, Clock, Star } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';

const MerchantList = () => {
  const [sortBy, setSortBy] = useState('best-rate');
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = (location.state as any) || {};

  const merchants = [
    {
      id: 1,
      name: 'Alpha Trades',
      avatar: 'AT',
      rating: 4.8,
      status: 'Online',
      statusColor: 'bg-green-500',
      nairaToBtc: '₦1,250,000',
      btcToNaira: '₦1,245,000',
      nairaToUsdt: '₦750',
      usdtToNaira: '₦748',
      limits: '₦1k - ₦10M',
      estimatedTime: '5 mins'
    },
    {
      id: 2,
      name: 'Swift Exchange',
      avatar: 'SE',
      rating: 4.9,
      status: 'Online',
      statusColor: 'bg-green-500',
      nairaToBtc: '₦1,251,000',
      btcToNaira: '₦1,246,000',
      nairaToUsdt: '₦752',
      usdtToNaira: '₦749',
      limits: '₦5k - ₦50M',
      estimatedTime: '3 mins'
    },
    {
      id: 3,
      name: 'Secure Wallets',
      avatar: 'SW',
      rating: 4.5,
      status: 'Offline',
      statusColor: 'bg-gray-400',
      nairaToBtc: '₦1,248,000',
      btcToNaira: '₦1,243,000',
      nairaToUsdt: '₦749',
      usdtToNaira: '₦747',
      limits: '₦10k - ₦20M',
      estimatedTime: '10 mins'
    },
    {
      id: 4,
      name: 'Global Connect',
      avatar: 'GC',
      rating: 4.7,
      status: 'Online',
      statusColor: 'bg-green-500',
      nairaToBtc: '₦1,252,000',
      btcToNaira: '₦1,247,000',
      nairaToUsdt: '₦753',
      usdtToNaira: '₦750',
      limits: '₦2k - ₦30M',
      estimatedTime: '4 mins'
    },
    {
      id: 5,
      name: 'Reliable Trader',
      avatar: 'RT',
      rating: 4.3,
      status: 'Offline',
      statusColor: 'bg-gray-400',
      nairaToBtc: '₦1,253,000',
      btcToNaira: '₦1,248,000',
      nairaToUsdt: '₦754',
      usdtToNaira: '₦751',
      limits: '₦1k - ₦5M',
      estimatedTime: '8 mins'
    }
  ];

  const handleMerchantSelect = (merchantId: number) => {
    console.log('Selected merchant:', merchantId);
    // Proceed to the unified payment status flow with selected merchant and amounts
    navigate('/payment-status', { state: { amount, nairaAmount, merchantId, mode: 'buy', step: 1 } });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/merchant-selection" className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Merchant List</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Bell size={24} className="text-gray-600" />
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 bg-gray-800 text-white border-gray-700">
              <SelectValue placeholder="Sort by: Best Rate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best-rate">Sort by: Best Rate</SelectItem>
              <SelectItem value="fastest">Sort by: Fastest</SelectItem>
              <SelectItem value="highest-rated">Sort by: Highest Rated</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="bg-gray-800 text-white border-gray-700">
            <Filter size={16} />
          </Button>
        </div>

        {/* Filter Tags */}
        <div className="flex space-x-2 mt-3">
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Online</span>
          <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full flex items-center">
            <Star size={12} className="mr-1" />
            Good Reviews
          </span>
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">Low Rates</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border-b border-gray-100">
        <div className="flex items-start">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
          </div>
          <p className="text-sm text-gray-700">
            Select merchants with high ratings and fast payout history. You can always report issues from the transaction screen.
          </p>
        </div>
      </div>

      {/* Merchant List */}
      <div className="p-4 space-y-4 pb-20">
        {merchants.map((merchant) => (
          <Card key={merchant.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            {/* Merchant Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg">{merchant.avatar}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{merchant.name}</h3>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={`${
                          i < Math.floor(merchant.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">{merchant.rating}</span>
                  </div>
                </div>
              </div>
              <span className={`${merchant.statusColor} text-white text-xs px-2 py-1 rounded-full`}>
                {merchant.status}
              </span>
            </div>

            {/* Trading Pairs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-blue-500 font-medium mb-1">Naira to BTC</p>
                <p className="text-sm font-semibold text-gray-800">{merchant.nairaToBtc}</p>
                <p className="text-xs text-blue-500 font-medium mb-1 mt-2">Naira to USDT</p>
                <p className="text-sm font-semibold text-gray-800">{merchant.nairaToUsdt}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500 font-medium mb-1">BTC to Naira</p>
                <p className="text-sm font-semibold text-gray-800">{merchant.btcToNaira}</p>
                <p className="text-xs text-blue-500 font-medium mb-1 mt-2">USDT to Naira</p>
                <p className="text-sm font-semibold text-gray-800">{merchant.usdtToNaira}</p>
              </div>
            </div>

            {/* Limits and Time */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-blue-500 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Limits: {merchant.limits}</span>
              </div>
              <div className="flex items-center text-blue-500 text-sm">
                <Clock size={14} className="mr-1" />
                <span>Est. Time: {merchant.estimatedTime}</span>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={() => handleMerchantSelect(merchant.id)}
              className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
            >
              Select This Merchant
            </Button>
          </Card>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MerchantList;
