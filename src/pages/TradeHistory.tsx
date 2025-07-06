
import React, { useState } from 'react';
import { Calendar, ChevronDown, Search, ArrowDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TradeHistory = () => {
  const [dateRange, setDateRange] = useState('Date Range');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const transactions = [
    {
      id: 1,
      amount: '0.05 BTC',
      nairaAmount: '₦45,200,000',
      total: '₦2,260,000',
      txId: 'TXN123456789',
      date: '2023-10-26',
      time: '14:30',
      merchant: '👤',
      rating: 4.8,
      status: 'completed',
      coin: 'BTC'
    },
    {
      id: 2,
      amount: '1.2 ETH',
      nairaAmount: '₦3,450,000',
      total: '₦4,140,000',
      txId: 'TXN789012345',
      date: '2023-10-25',
      time: '09:15',
      merchant: '👤',
      rating: 4.5,
      status: 'pending',
      coin: 'ETH'
    },
    {
      id: 3,
      amount: '200 USDT',
      nairaAmount: '₦1,560',
      total: '₦312,000',
      txId: 'TXN456789012',
      date: '2023-10-24',
      time: '17:45',
      merchant: '👤',
      rating: 3.9,
      status: 'failed',
      coin: 'USDT'
    },
    {
      id: 4,
      amount: '0.08 BTC',
      nairaAmount: '₦44,800,000',
      total: '₦3,584,000',
      txId: 'TXN234567890',
      date: '2023-10-22',
      time: '11:20',
      merchant: '👤',
      rating: 4.2,
      status: 'completed',
      coin: 'BTC'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getCoinIcon = (coin: string) => {
    switch (coin) {
      case 'BTC':
        return '₿';
      case 'ETH':
        return '⧫';
      case 'USDT':
        return '$';
      default:
        return '●';
    }
  };

  const getCoinColor = (coin: string) => {
    switch (coin) {
      case 'BTC':
        return 'text-orange-500';
      case 'ETH':
        return 'text-blue-500';
      case 'USDT':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Trade History</h1>
          <p className="text-sm text-gray-500 mt-1">Track all your completed and pending trades</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600">🔔</span>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600">👤</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4">
        <div className="flex space-x-3">
          <button className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Calendar size={16} className="mr-2" />
            <span className="text-sm">{dateRange}</span>
          </button>
          <button className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
            <span className="text-sm mr-2">{statusFilter}</span>
            <ChevronDown size={16} />
          </button>
          <button className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-700 hover:bg-gray-100">
            <Search size={16} />
          </button>
        </div>

        {/* Pull to refresh */}
        <div className="flex items-center justify-center py-4 text-gray-500">
          <ArrowDown size={16} className="mr-2" />
          <span className="text-sm">Pull to refresh</span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 space-y-4 pb-20">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className={`text-lg font-bold ${getCoinColor(transaction.coin)}`}>
                    {getCoinIcon(transaction.coin)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{transaction.amount}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span className="mr-1">@</span>
                    <span>{transaction.nairaAmount}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    Total: {transaction total}
                  </p>
                </div>
              </div>
              {getStatusBadge(transaction.status)}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-3">
              <p className="font-mono">{transaction.txId}</p>
              <p>
                {transaction.date} • {transaction.time}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">{transaction.merchant}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">⭐</span>
                  <span className="text-sm font-medium text-gray-900">
                    {transaction.rating}
                  </span>
                </div>
              </div>
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
          <button className="flex flex-col items-center text-gray-400">
            <div className="w-6 h-6 mb-1">💼</div>
            <span className="text-xs">My Trades</span>
          </button>
          <button className="flex flex-col items-center text-blue-600">
            <div className="w-6 h-6 mb-1">📋</div>
            <span className="text-xs font-medium">Transactions</span>
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

export default TradeHistory;
