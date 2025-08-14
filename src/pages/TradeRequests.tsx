import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import TradeRequestCard from '@/components/TradeRequestCard';
import { useToast } from '@/hooks/use-toast';

const TradeRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock trade requests data
  const [tradeRequests, setTradeRequests] = useState([
    {
      id: '1',
      type: 'buy' as const,
      amount: '0.05',
      coin: 'BTC',
      nairaAmount: 180000,
      rate: 3600000,
      merchantName: 'John Smith',
      merchantRating: 4.8,
      timeAgo: '2 mins ago',
      paymentMethod: 'Bank Transfer',
      status: 'pending' as const,
    },
    {
      id: '2',
      type: 'sell' as const,
      amount: '150',
      coin: 'USDT',
      nairaAmount: 225000,
      rate: 1500,
      merchantName: 'Sarah Johnson',
      merchantRating: 4.9,
      timeAgo: '5 mins ago',
      paymentMethod: 'Mobile Money',
      status: 'pending' as const,
    },
    {
      id: '3',
      type: 'buy' as const,
      amount: '0.1',
      coin: 'ETH',
      nairaAmount: 850000,
      rate: 8500000,
      merchantName: 'Mike Chen',
      merchantRating: 4.7,
      timeAgo: '8 mins ago',
      paymentMethod: 'Bank Transfer',
      status: 'active' as const,
    },
    {
      id: '4',
      type: 'sell' as const,
      amount: '0.02',
      coin: 'BTC',
      nairaAmount: 72000,
      rate: 3600000,
      merchantName: 'Emma Wilson',
      merchantRating: 4.6,
      timeAgo: '15 mins ago',
      paymentMethod: 'Cash Pickup',
      status: 'expired' as const,
    }
  ]);

  const handleAcceptTrade = (requestId: string) => {
    // Navigate to trade flow
    navigate('/buy-crypto-match', { state: { requestId } });
    toast({
      title: "Trade Accepted",
      description: "You've accepted the trade request. Proceeding to payment.",
    });
  };

  const handleDeclineTrade = (requestId: string) => {
    setTradeRequests(prev => prev.filter(request => request.id !== requestId));
    toast({
      title: "Trade Declined",
      description: "You've declined the trade request.",
      variant: "destructive"
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Trade requests have been updated.",
      });
    }, 1000);
  };

  const filteredRequests = tradeRequests.filter(request => {
    const matchesSearch = request.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.coin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || request.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = tradeRequests.filter(r => r.status === 'pending').length;
  const activeCount = tradeRequests.filter(r => r.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-2 p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Trade Requests</h1>
              <p className="text-sm text-gray-600">{pendingCount} pending • {activeCount} active</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by merchant or coin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Filter size={16} className="mr-1" />
            Filter
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1">
          {(['all', 'buy', 'sell'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? 'All Requests' : `${type.charAt(0).toUpperCase() + type.slice(1)} Requests`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trade requests found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No active trade requests at the moment'}
            </p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="mx-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <TradeRequestCard
                key={request.id}
                request={request}
                onAccept={handleAcceptTrade}
                onDecline={handleDeclineTrade}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mx-4 mt-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{tradeRequests.length}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeRequests;