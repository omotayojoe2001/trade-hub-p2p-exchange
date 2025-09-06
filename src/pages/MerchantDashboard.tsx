import React, { useState } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, Users, Shield, Clock, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');

  const pendingTrades = [
    {
      id: 'TR001',
      type: 'sell',
      customer: 'No Customer',
      amount: '0.0045 BTC',
      nairaAmount: '₦125,000',
      timeLeft: '14:32',
      status: 'waiting_payment'
    },
    {
      id: 'TR002',
      type: 'buy',
      customer: 'Sarah Kim',
      amount: '0.021 BTC',
      nairaAmount: '₦558,792',
      timeLeft: '08:15',
      status: 'escrow_funded'
    }
  ];

  const stats = {
    totalTrades: 156,
    totalVolume: '₦45.2M',
    rating: 4.8,
    responseTime: '2 min'
  };

  const handleTradeAction = (tradeId: string, action: string) => {
    console.log(`${action} for trade ${tradeId}`);
    // Navigate to trade details or show action modal
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Merchant Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your crypto trades</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">Online</span>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrades}</p>
              </div>
              <TrendingUp size={24} className="text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volume</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVolume}</p>
              </div>
              <DollarSign size={24} className="text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating} <Star className="w-6 h-6 inline" /></p>
              </div>
              <Users size={24} className="text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseTime}</p>
              </div>
              <Clock size={24} className="text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
              Update Rates
            </Button>
            <Button variant="outline" className="h-12">
              Set Availability
            </Button>
          </div>
        </div>

        {/* Active Trades */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Trades</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pendingTrades.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Trade List */}
          <div className="space-y-3">
            {pendingTrades.map((trade) => (
              <Card key={trade.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      trade.type === 'buy' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {trade.type === 'buy' ? (
                        <TrendingUp size={16} className="text-green-600" />
                      ) : (
                        <DollarSign size={16} className="text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{trade.customer}</p>
                      <p className="text-sm text-gray-600">
                        {trade.type === 'buy' ? 'Buying' : 'Selling'} {trade.amount}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{trade.nairaAmount}</p>
                    <p className="text-sm text-red-600">⏱ {trade.timeLeft}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {trade.status === 'waiting_payment' ? (
                      <AlertTriangle size={16} className="text-yellow-500" />
                    ) : (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    <span className="text-sm text-gray-600">
                      {trade.status === 'waiting_payment' ? 'Waiting for payment' : 'Escrow funded'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {trade.status === 'waiting_payment' ? (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleTradeAction(trade.id, 'confirm_payment')}
                      >
                        Confirm Payment
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleTradeAction(trade.id, 'release_escrow')}
                      >
                        Release Escrow
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTradeAction(trade.id, 'view_details')}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Security Reminder</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Always verify payment before releasing escrow. Never release crypto without confirming payment receipt.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MerchantDashboard;