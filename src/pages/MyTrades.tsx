
import React, { useState } from 'react';
import { Search, ArrowDown, ArrowUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const MyTrades = () => {
  const [activeTab, setActiveTab] = useState('ongoing');

  const trades = [
    {
      id: 1,
      type: 'buy',
      coin: 'BTC',
      amount: '₦520,000',
      coinAmount: '≈ 0.0045 BTC',
      merchant: 'BlockExchange24',
      rating: 4.8,
      status: 'waiting_payment',
      progress: 50,
      startTime: 'June 28, 10:34 AM',
      avatar: '👤'
    },
    {
      id: 2,
      type: 'sell',
      coin: 'USDT',
      amount: '₦730,500',
      coinAmount: '≈ 500 USDT',
      merchant: 'CryptoQueen',
      rating: 4.9,
      status: 'waiting_confirmation',
      progress: 75,
      startTime: 'June 28, 09:15 AM',
      avatar: '👩'
    },
    {
      id: 3,
      type: 'buy',
      coin: 'BTC',
      amount: '₦1,250,000',
      coinAmount: '≈ 0.0089 BTC',
      merchant: 'BitTrader',
      rating: 4.7,
      status: 'escrow_released',
      progress: 100,
      startTime: 'June 27, 15:22 AM',
      avatar: '🧑'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_payment':
        return (
          <div className="flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
            <Clock size={14} className="mr-1" />
            Waiting for Payment
          </div>
        );
      case 'waiting_confirmation':
        return (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            Waiting for Confirmation
          </div>
        );
      case 'escrow_released':
        return (
          <div className="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
            <CheckCircle size={14} className="mr-1" />
            Escrow Released
          </div>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'waiting_payment':
        return 'bg-orange-500';
      case 'waiting_confirmation':
        return 'bg-blue-500';
      case 'escrow_released':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 mr-2">My Trades</h1>
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">▼</span>
          </div>
        </div>
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">●</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by merchant or amount"
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex space-x-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ongoing'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-500 border-transparent'
            }`}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Ongoing
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'text-green-600 border-green-600'
                : 'text-gray-500 border-transparent'
            }`}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Completed
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cancelled'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent'
            }`}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Cancelled
            </div>
          </button>
        </div>
      </div>

      {/* Trades List */}
      <div className="px-4 space-y-4">
        {trades.map((trade) => (
          <div key={trade.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  trade.type === 'buy' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {trade.type === 'buy' ? (
                    <ArrowDown size={16} className="text-blue-600" />
                  ) : (
                    <ArrowUp size={16} className="text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {trade.type}ing {trade.coin}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{trade.amount}</p>
                  <p className="text-sm text-gray-500">{trade.coinAmount}</p>
                </div>
              </div>
              {getStatusBadge(trade.status)}
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg">{trade.avatar}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{trade.merchant}</p>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="text-sm text-gray-600">{trade.rating}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Started:</p>
                <p className="text-sm font-medium text-gray-900">{trade.startTime}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(trade.status)}`}
                    style={{ width: `${trade.progress}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">{trade.progress}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center text-gray-400">
            <div className="w-6 h-6 mb-1">🏠</div>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <div className="w-6 h-6 mb-1">🔄</div>
            <span className="text-xs">Buy/Sell</span>
          </button>
          <button className="flex flex-col items-center text-blue-600">
            <div className="w-6 h-6 mb-1">💼</div>
            <span className="text-xs font-medium">My Trades</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <div className="w-6 h-6 mb-1">📋</div>
            <span className="text-xs">Transactions</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <div className="w-6 h-6 mb-1">⚙️</div>
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTrades;
