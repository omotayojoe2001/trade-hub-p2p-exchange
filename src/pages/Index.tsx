
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Clock, Trophy, Bank } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Header & User Greeting */}
      <div className="mb-6">
        <p className="text-base text-gray-500 mb-2" style={{ fontFamily: 'Poppins' }}>
          Good Morning
        </p>
        <h1 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
          Sarah Johnson
        </h1>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter' }}>
            Total Traders
          </p>
          <p className="text-2xl font-semibold text-blue-500" style={{ fontFamily: 'Poppins' }}>
            12,847
          </p>
        </Card>
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter' }}>
            Volume Traded
          </p>
          <p className="text-2xl font-semibold text-blue-500" style={{ fontFamily: 'Poppins' }}>
            $2.4M
          </p>
        </Card>
      </div>

      {/* Time Filters */}
      <div className="flex space-x-6 mb-6">
        <button className="text-sm font-medium text-blue-500" style={{ fontFamily: 'Inter' }}>Today</button>
        <button className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Inter' }}>This Week</button>
        <button className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Inter' }}>This Month</button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Link to="/buy-sell" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Plus size={24} className="text-blue-500" />
          </div>
          <span className="text-xs font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>Buy</span>
        </Link>
        <Link to="/buy-sell" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Plus size={24} className="text-blue-500" />
          </div>
          <span className="text-xs font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>Sell</span>
        </Link>
        <Link to="/coins" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Clock size={24} className="text-blue-500" />
          </div>
          <span className="text-xs font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>History</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Bank size={24} className="text-blue-500" />
          </div>
          <span className="text-xs font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>Bank</span>
        </Link>
      </div>

      {/* Recent Trades */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins' }}>
          Recent Trades
        </h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800" style={{ fontFamily: 'Inter' }}>Trade #124 Completed</p>
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>BTC/USD</p>
              </div>
              <div className="text-right">
                <p className="text-blue-500 font-medium" style={{ fontFamily: 'Inter' }}>$45,230</p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>2m ago</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800" style={{ fontFamily: 'Inter' }}>Trade #123 Pending</p>
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>ETH/USD</p>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-medium" style={{ fontFamily: 'Inter' }}>$3,120</p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>5m ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Upsell Banner */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>
              Withdraw USD in Cash
            </h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>
              Now available for Premium users
            </p>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm" style={{ fontFamily: 'Poppins' }}>
            Upgrade
          </Button>
        </div>
      </Card>

      {/* Platform Updates */}
      <div className="mb-6">
        <div className="flex space-x-6 mb-4">
          <button className="text-sm font-medium text-blue-500" style={{ fontFamily: 'Inter' }}>All</button>
          <button className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Inter' }}>Favorites</button>
          <button className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Inter' }}>DeFi</button>
          <button className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Inter' }}>NFT</button>
          <Link to="/coins" className="text-sm font-medium text-gray-400" style={{ fontFamily: 'Inter' }}>See All</Link>
        </div>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Bitcoin (BTC)</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>$68,523</p>
              <p className="text-sm font-semibold text-green-500" style={{ fontFamily: 'Inter' }}>+5.2%</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Ethereum (ETH)</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>$3,847</p>
              <p className="text-sm font-semibold text-green-500" style={{ fontFamily: 'Inter' }}>+3.8%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral & Rewards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
          <p className="text-sm font-medium mb-2" style={{ fontFamily: 'Inter' }}>
            Refer & Earn
          </p>
          <p className="text-xs" style={{ fontFamily: 'Inter' }}>
            Earn points when you invite friends
          </p>
        </Card>
        <Card className="p-4 bg-white rounded-xl shadow-sm flex items-center">
          <Trophy size={24} className="text-yellow-500 mr-2" />
          <div>
            <p className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
              2,450
            </p>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>Points</p>
          </div>
        </Card>
      </div>

      {/* Premium Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins' }}>
          Unlock Premium Features
        </h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm flex items-center">
            <Bank size={24} className="text-blue-500 mr-3" />
            <div>
              <p className="font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>Withdraw USD</p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>Cash pickup available</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm flex items-center">
            <Clock size={24} className="text-blue-500 mr-3" />
            <div>
              <p className="font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>Priority Trading</p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>Faster processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
