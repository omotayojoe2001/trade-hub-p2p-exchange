import React, { useState, useMemo } from 'react';
import { Search, ArrowDown, ArrowUp, Clock, CheckCircle, XCircle, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import PaymentConfirmationDialog from "@/components/PaymentConfirmationDialog";
import BottomNavigation from '@/components/BottomNavigation';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const MyTrades = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);

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
      date: new Date('2024-06-28'),
      avatar: '👤',
      category: 'ongoing'
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
      date: new Date('2024-06-28'),
      avatar: '👩',
      awaitingUserAction: true,
      category: 'ongoing'
    },
    {
      id: 3,
      type: 'buy',
      coin: 'BTC',
      amount: '₦1,250,000',
      coinAmount: '≈ 0.0089 BTC',
      merchant: 'BitTrader',
      rating: 4.7,
      status: 'completed',
      progress: 100,
      startTime: 'June 27, 15:22 PM',
      date: new Date('2024-06-27'),
      avatar: '🧑',
      category: 'completed'
    },
    {
      id: 4,
      type: 'sell',
      coin: 'USDT',
      amount: '₦450,000',
      coinAmount: '≈ 300 USDT',
      merchant: 'FastCrypto',
      rating: 4.6,
      status: 'cancelled',
      progress: 0,
      startTime: 'June 26, 14:30 PM',
      date: new Date('2024-06-26'),
      avatar: '👨',
      category: 'cancelled'
    },
    {
      id: 5,
      type: 'buy',
      coin: 'BTC',
      amount: '₦890,000',
      coinAmount: '≈ 0.0078 BTC',
      merchant: 'CoinMaster',
      rating: 4.9,
      status: 'completed',
      progress: 100,
      startTime: 'June 25, 11:45 AM',
      date: new Date('2024-06-25'),
      avatar: '👩‍💼',
      category: 'completed'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_payment':
        return (
          <div className="flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
            <Clock size={14} className="mr-1" />
            Waiting for Payment
          </div>
        );
      case 'waiting_confirmation':
        return (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            Waiting for Confirmation
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle size={14} className="mr-1" />
            Completed
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <XCircle size={14} className="mr-1" />
            Cancelled
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
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleConfirmPayment = (tradeId: number) => {
    setSelectedTradeId(tradeId);
    setShowConfirmDialog(true);
  };

  const handleConfirmationResponse = (received: boolean) => {
    if (received && selectedTradeId) {
      console.log('Payment confirmed for trade:', selectedTradeId);
      // In real app, this would update the trade status
    }
    setShowConfirmDialog(false);
    setSelectedTradeId(null);
  };

  const handleTradeClick = (tradeId: number) => {
    navigate(`/trade-details/${tradeId}`);
  };

  // Filter trades based on active tab, search, type, and date
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Tab filter
      if (activeTab === 'ongoing' && trade.category !== 'ongoing') return false;
      if (activeTab === 'completed' && trade.category !== 'completed') return false;
      if (activeTab === 'cancelled' && trade.category !== 'cancelled') return false;

      // Search filter
      if (searchQuery && !trade.merchant.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !trade.amount.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Type filter
      if (typeFilter !== 'all' && trade.type !== typeFilter) return false;

      // Date filter
      if (dateFrom && trade.date < dateFrom) return false;
      if (dateTo && trade.date > dateTo) return false;

      return true;
    });
  }, [trades, activeTab, searchQuery, typeFilter, dateFrom, dateTo]);

  const incompleteTradesCount = trades.filter(trade => trade.awaitingUserAction).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Trades</h1>
          </div>
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{incompleteTradesCount}</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {incompleteTradesCount > 0 && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <p className="text-orange-900 font-semibold text-sm">
                {incompleteTradesCount} trade{incompleteTradesCount > 1 ? 's' : ''} awaiting your confirmation
              </p>
              <p className="text-orange-700 text-xs mt-1">
                Please confirm if you've received payment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by merchant or amount"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        
        {/* Filters Row */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 bg-white rounded-xl border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-36 justify-start text-left font-normal bg-white rounded-xl border-gray-200 shadow-sm",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <Calendar size={16} className="mr-2" />
                {dateFrom ? format(dateFrom, "MMM dd") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-36 justify-start text-left font-normal bg-white rounded-xl border-gray-200 shadow-sm",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <Calendar size={16} className="mr-2" />
                {dateTo ? format(dateTo, "MMM dd") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo || typeFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
                setTypeFilter('all');
              }}
              className="px-3 text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'ongoing'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  activeTab === 'ongoing' ? 'bg-white' : 'bg-orange-500'
                }`}></div>
                Ongoing
              </div>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-green-500'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  activeTab === 'completed' ? 'bg-white' : 'bg-green-500'
                }`}></div>
                Completed
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'cancelled'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  activeTab === 'cancelled' ? 'bg-white' : 'bg-red-500'
                }`}></div>
                Cancelled
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Trades List */}
      <div className="px-4 space-y-4">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No trades found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <div 
              key={trade.id} 
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTradeClick(trade.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    trade.type === 'buy' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {trade.type === 'buy' ? (
                      <ArrowDown size={18} className="text-blue-600" />
                    ) : (
                      <ArrowUp size={18} className="text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {trade.type}ing {trade.coin}
                    </h3>
                    <p className="text-xl font-bold text-gray-900 mt-1">{trade.amount}</p>
                    <p className="text-sm text-gray-500">{trade.coinAmount}</p>
                  </div>
                </div>
                {getStatusBadge(trade.status)}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mr-3 shadow-sm">
                    <span className="text-lg">{trade.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{trade.merchant}</p>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      <span className="text-sm text-gray-600 font-medium">{trade.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Started:</p>
                  <p className="text-sm font-medium text-gray-900">{trade.startTime}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 mr-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(trade.status)}`}
                      style={{ width: `${trade.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">{trade.progress}%</span>
              </div>

              {/* Action Button for Waiting Confirmation */}
              {trade.status === 'waiting_confirmation' && trade.awaitingUserAction && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmPayment(trade.id);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  Confirm Payment Received
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmationResponse}
      />

      <BottomNavigation />
    </div>
  );
};

export default MyTrades;