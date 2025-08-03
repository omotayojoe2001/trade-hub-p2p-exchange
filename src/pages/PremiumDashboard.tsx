import React from 'react';
import { ArrowLeft, Crown, Zap, Shield, DollarSign, TrendingUp, Users, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

const PremiumDashboard = () => {
  const navigate = useNavigate();

  const premiumFeatures = [
    {
      icon: <Zap size={20} className="text-yellow-500" />,
      title: 'Priority Matching',
      description: 'Get matched with merchants 3x faster',
      status: 'active'
    },
    {
      icon: <DollarSign size={20} className="text-green-500" />,
      title: 'Instant Withdrawals',
      description: 'Cash out to your bank instantly',
      status: 'active'
    },
    {
      icon: <Shield size={20} className="text-blue-500" />,
      title: 'Premium Support',
      description: '24/7 dedicated customer support',
      status: 'active'
    },
    {
      icon: <TrendingUp size={20} className="text-purple-500" />,
      title: 'Advanced Analytics',
      description: 'Detailed trading insights and reports',
      status: 'active'
    }
  ];

  const premiumStats = {
    tradesSaved: '₦125,000',
    fastMatches: 47,
    supportResponse: '< 1 min',
    premiumSince: 'Dec 2024'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <Crown size={20} className="text-yellow-500" />
            <h1 className="text-lg font-semibold text-gray-900">Premium Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full">
          <Crown size={14} />
          <span className="text-sm font-medium">Premium Active</span>
        </div>
      </div>

      <div className="p-4">
        {/* Welcome Banner */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Premium! 🎉</h2>
              <p className="text-purple-100">
                You're now enjoying exclusive features and priority service.
              </p>
            </div>
            <Crown size={48} className="text-yellow-300" />
          </div>
        </Card>

        {/* Premium Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fees Saved</p>
                <p className="text-2xl font-bold text-green-600">{premiumStats.tradesSaved}</p>
              </div>
              <DollarSign size={24} className="text-green-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fast Matches</p>
                <p className="text-2xl font-bold text-blue-600">{premiumStats.fastMatches}</p>
              </div>
              <Zap size={24} className="text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Support Response</p>
                <p className="text-2xl font-bold text-purple-600">{premiumStats.supportResponse}</p>
              </div>
              <Clock size={24} className="text-purple-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-2xl font-bold text-gray-900">{premiumStats.premiumSince}</p>
              </div>
              <Users size={24} className="text-gray-500" />
            </div>
          </Card>
        </div>

        {/* Premium Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Premium Features</h3>
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
              <Zap size={16} className="mr-2" />
              Priority Trade
            </Button>
            <Button className="h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white">
              <DollarSign size={16} className="mr-2" />
              Instant Withdraw
            </Button>
          </div>
        </div>

        {/* Subscription Info */}
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Subscription Details</h4>
            <Crown size={20} className="text-yellow-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">Premium Annual</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next billing:</span>
              <span className="font-medium">Dec 15, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Manage Subscription
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PremiumDashboard;