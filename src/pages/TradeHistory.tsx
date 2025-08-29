import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronRight, Search, ArrowDown, Bell, Settings, RefreshCw, Filter, ArrowLeft, Clock, Star, User, Coins, Gem, CircleDollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TradeHistory = () => {
  const navigate = useNavigate();
  const { isQuickAuthActive } = useQuickAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [tradeType, setTradeType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const transactions = [
    {
      id: 1,
      amount: '0.5 BTC',
      nairaAmount: '₦28,000,000',
      total: '₦14,000,000',
      txId: 'TXN123456789',
      date: '2023-10-26',
      time: '14:30',
      merchant: 'Michael Adebayo',
      merchantAvatar: 'MA',
      rating: 4.8,
      status: 'completed',
      coin: 'BTC',
      type: 'sell',
      merchantPhone: '+234 801 234 5678',
      bankAccount: 'GT Bank - 0123456789'
    },
    {
      id: 2,
      amount: '1.2 ETH',
      nairaAmount: '₦3,450,000',
      total: '₦4,140,000',
      txId: 'TXN789012345',
      date: '2023-10-25',
      time: '09:15',
      merchant: 'Sarah Johnson',
      merchantAvatar: 'SJ',
      rating: 4.5,
      status: 'pending',
      coin: 'ETH',
      type: 'buy',
      merchantPhone: '+234 802 345 6789',
      bankAccount: 'Access Bank - 0987654321'
    },
    {
      id: 3,
      amount: '200 USDT',
      nairaAmount: '₦1,560',
      total: '₦312,000',
      txId: 'TXN456789012',
      date: '2023-10-24',
      time: '17:45',
      merchant: 'David Okafor',
      merchantAvatar: 'DO',
      rating: 3.9,
      status: 'cancelled',
      coin: 'USDT',
      type: 'sell',
      merchantPhone: '+234 803 456 7890',
      bankAccount: 'First Bank - 0456789123'
    },
    {
      id: 4,
      amount: '0.08 BTC',
      nairaAmount: '₦44,800,000',
      total: '₦3,584,000',
      txId: 'TXN234567890',
      date: '2023-10-22',
      time: '11:20',
      merchant: 'Grace Okwu',
      merchantAvatar: 'GO',
      rating: 4.2,
      status: 'completed',
      coin: 'BTC',
      type: 'buy',
      merchantPhone: '+234 804 567 8901',
      bankAccount: 'UBA Bank - 0789123456'
    },
    {
      id: 5,
      amount: '5.0 ETH',
      nairaAmount: '₦3,200,000',
      total: '₦16,000,000',
      txId: 'TXN345678901',
      date: '2023-10-21',
      time: '16:30',
      merchant: 'James Wilson',
      merchantAvatar: 'JW',
      rating: 4.7,
      status: 'pending',
      coin: 'ETH',
      type: 'sell',
      merchantPhone: '+234 805 678 9012',
      bankAccount: 'Zenith Bank - 0234567890'
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
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getCoinIcon = (coin: string) => {
    switch (coin) {
      case 'BTC':
        return <Coins size={18} className={getCoinColor(coin)} />;
      case 'ETH':
        return <Gem size={18} className={getCoinColor(coin)} />;
      case 'USDT':
        return <CircleDollarSign size={18} className={getCoinColor(coin)} />;
      default:
        return <Coins size={18} className="text-gray-500" />;
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
        transaction.coin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' || transaction.status === activeTab;
      
      const matchesDateRange = dateRange === 'all' || (() => {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        
        switch (dateRange) {
          case 'today':
            return transactionDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return transactionDate >= monthAgo;
          default:
            return true;
        }
      })();
      
      const matchesType = tradeType === 'all' || transaction.type === tradeType;
      
      return matchesSearch && matchesTab && matchesDateRange && matchesType;
    });
  }, [transactions, searchQuery, activeTab, dateRange, tradeType]);

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Trade History</h1>
              <p className="text-sm text-gray-500 mt-1">Track all your transactions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Filter size={20} className="text-gray-600" />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
              disabled={isRefreshing}
            >
              <RefreshCw size={20} className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by transaction ID, coin, merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <select 
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="buy">Buying</option>
              <option value="sell">Selling</option>
            </select>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 m-4 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-sm font-medium">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-sm font-medium">Ongoing</TabsTrigger>
            <TabsTrigger value="completed" className="text-sm font-medium">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-sm font-medium">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <RefreshCw size={16} className="mr-2 animate-spin" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}

      {/* Transactions List */}
      <div className="p-4 space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              onClick={() => handleTransactionClick(transaction.txId)}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
                    {getCoinIcon(transaction.coin)}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-bold text-gray-900 mr-2">{transaction.amount}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        transaction.type === 'buy' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {transaction.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <span className="mr-1">@</span>
                      <span>{transaction.nairaAmount}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Total: {transaction.total}
                    </p>
                  </div>
                </div>
                {getStatusBadge(transaction.status)}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="font-mono text-sm text-gray-600 mb-2">{transaction.txId}</p>
                <p className="text-sm text-gray-500">
                  {transaction.date} • {transaction.time}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.merchant}</p>
                    <div className="flex items-center">
                      <Star size={14} className="text-yellow-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600">
                        {transaction.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default TradeHistory;
