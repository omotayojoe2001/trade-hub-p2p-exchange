
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Building2, Bell, Settings, TrendingUp, ChevronRight, Star, DollarSign, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-blue-600 px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">👤</span>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Good Morning</p>
            <h1 className="text-white text-lg font-medium">Sarah Johnson</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/notifications">
            <Bell size={24} className="text-white" />
          </Link>
          <Settings size={24} className="text-white" />
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center mb-2">
              <TrendingUp size={16} className="text-green-500 mr-2" />
              <span className="text-gray-500 text-sm">Total Traders</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">12,847</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <DollarSign size={16} className="text-blue-500 mr-2" />
              <span className="text-gray-500 text-sm">Volume Traded</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">$2.4M</p>
          </div>
        </div>
        
        {/* Time Filters */}
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Today
          </button>
          <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
            This Week
          </button>
          <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
            This Month
          </button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-white text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link to="/buy-sell" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <ArrowUp size={24} className="text-green-500" />
            </div>
            <span className="text-white text-sm font-medium">Buy</span>
          </Link>
          <Link to="/buy-sell" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <ArrowDown size={24} className="text-red-500" />
            </div>
            <span className="text-white text-sm font-medium">Sell</span>
          </Link>
          <Link to="/coins" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Clock size={24} className="text-blue-500" />
            </div>
            <span className="text-white text-sm font-medium">History</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Building2 size={24} className="text-purple-500" />
            </div>
            <span className="text-white text-sm font-medium">Bank</span>
          </Link>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="mb-6">
        <h2 className="text-white text-lg font-semibold mb-4">Recent Trades</h2>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-500 text-lg">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Trade #124 Completed</p>
                <p className="text-sm text-gray-500">BTC/USD • $45,230</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2m ago</span>
          </div>
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <Clock size={16} className="text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Trade #123 Pending</p>
                <p className="text-sm text-gray-500">ETH/USD • $3,120</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">5m ago</span>
          </div>
        </div>
      </div>

      {/* Withdraw USD Banner */}
      <Card className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg mb-1">Withdraw USD in Cash</h3>
            <p className="text-sm text-green-100">Now available for Premium users</p>
          </div>
          <div className="text-2xl">💵</div>
        </div>
        <Button className="bg-white text-green-600 hover:bg-gray-100 mt-3 w-full font-medium">
          Upgrade to Premium
        </Button>
      </Card>

      {/* Platform Updates */}
      <div className="bg-white p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-500 text-lg">📢</span>
            </div>
            <span className="font-semibold text-gray-900">Platform Updates</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-600">Maintenance notices & news</p>
      </div>

      {/* Coin Filters */}
      <div className="flex space-x-4 mb-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">All</button>
        <button className="text-white text-sm font-medium">Favorites</button>
        <button className="text-white text-sm font-medium">DeFi</button>
        <button className="text-white text-sm font-medium">NFT</button>
      </div>

      {/* Trending Coins */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-orange-400 text-lg mr-2">🔥</span>
            <h2 className="text-white text-lg font-semibold">Trending Coins</h2>
          </div>
          <Link to="/coins" className="text-blue-300 text-sm font-medium">See All</Link>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-500 font-bold">₿</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Bitcoin</p>
                <p className="text-sm text-gray-500">BTC</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">$68,523</p>
              <div className="flex items-center">
                <span className="text-green-500 text-sm font-semibold">+5.2%</span>
                <div className="ml-2 flex space-x-1">
                  <div className="w-1 h-4 bg-green-500 rounded"></div>
                  <div className="w-1 h-3 bg-green-500 rounded"></div>
                  <div className="w-1 h-5 bg-green-500 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-500 font-bold">Ξ</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ethereum</p>
                <p className="text-sm text-gray-500">ETH</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">$3,847</p>
              <div className="flex items-center">
                <span className="text-green-500 text-sm font-semibold">+3.8%</span>
                <div className="ml-2 flex space-x-1">
                  <div className="w-1 h-3 bg-green-500 rounded"></div>
                  <div className="w-1 h-4 bg-green-500 rounded"></div>
                  <div className="w-1 h-2 bg-green-500 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refer & Earn + My Rewards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Refer & Earn</h3>
            <span className="text-2xl">🎁</span>
          </div>
          <p className="text-sm text-orange-100">Earn points when you invite friends</p>
        </Card>
        
        <Card className="bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">My Rewards</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">2,450 Points</p>
        </Card>
      </div>

      {/* Unlock Premium Features */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Star size={20} className="text-yellow-400 mr-2" />
          <h2 className="text-white text-lg font-semibold">Unlock Premium Features</h2>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <DollarSign size={20} className="text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Withdraw USD</p>
                <p className="text-sm text-gray-500">Cash pickup available</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-lg">🔒</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Zap size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Priority Trading</p>
                <p className="text-sm text-gray-500">Faster processing</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-lg">🔒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
