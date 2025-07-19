import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, Search, ArrowDown, Bell, Settings, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';

const TradeHistory = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('Date Range');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = searchQuery === '' || 
        transaction.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.coin.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All Status' || transaction.status === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleTransactionClick = (txId: string) => {
    navigate(`/trade-details/${txId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Trade History</h1>
          <p className="text-sm text-gray-500 mt-1">Track all your completed and pending trades</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/notifications">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Bell size={16} className="text-yellow-600" />
            </div>
          </Link>
          <Link to="/settings">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Settings size={16} className="text-gray-600" />
            </div>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <div className="flex space-x-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All Status">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Calendar size={16} className="mr-2" />
            <span className="text-sm">{dateRange}</span>
          </button>
          <button 
            onClick={handleRefresh}
            className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <RefreshCw size={16} className="mr-2 animate-spin" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}

      {/* Transactions List */}
      <div className="px-4 space-y-4">
        {filteredTransactions.map((transaction) => (
          <div 
            key={transaction.id} 
            onClick={() => handleTransactionClick(transaction.txId)}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
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
                    Total: {transaction.total}
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

      <BottomNavigation />
    </div>
  );
};

export default TradeHistory;
