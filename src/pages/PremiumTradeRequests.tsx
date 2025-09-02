import React, { useState, useEffect } from 'react';
import { Crown, Search, Filter, Clock, TrendingUp, ArrowUpDown, Banknote, Coins, Loader2, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import CryptoIcon from '@/components/CryptoIcon';

// Mock data function
const getMockTradeRequests = () => {
  return [
    {
      id: '1',
      user_id: 'user1',
      crypto_type: 'BTC',
      amount: 0.05,
      rate: 150000000,
      cash_amount: 7500000,
      direction: 'crypto_to_cash',
      created_at: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '2',
      user_id: 'user2',
      crypto_type: 'ETH',
      amount: 2.5,
      rate: 5350000,
      cash_amount: 13375000,
      direction: 'cash_to_crypto',
      created_at: new Date(Date.now() - 300000).toISOString(),
      status: 'active'
    },
    {
      id: '3',
      user_id: 'user3',
      crypto_type: 'USDT',
      amount: 1000,
      rate: 1550,
      cash_amount: 1550000,
      direction: 'crypto_to_cash',
      created_at: new Date(Date.now() - 600000).toISOString(),
      status: 'active'
    }
  ];
};

const PremiumTradeRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [coinFilter, setCoinFilter] = useState('all');
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<any>(null);

  // Check for active codes
  useEffect(() => {
    const checkActiveCode = () => {
      const storedCode = localStorage.getItem('activeTradeCode');
      if (storedCode) {
        try {
          const codeData = JSON.parse(storedCode);
          if (codeData.status !== 'completed') {
            setActiveCode(codeData);
          }
        } catch (error) {
          console.error('Error parsing active code:', error);
        }
      }
    };

    checkActiveCode();

    // Listen for new codes
    const handleNewTradeCode = () => checkActiveCode();
    window.addEventListener('newTradeCode', handleNewTradeCode);

    return () => window.removeEventListener('newTradeCode', handleNewTradeCode);
  }, []);

  // Load trade requests from Supabase
  useEffect(() => {
    const loadTradeRequests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Use mock data instead of Supabase for now
        const requests = getMockTradeRequests();
        
        // Transform requests for display
        const transformedRequests = requests.map((request: any) => {
          const timeLeft = calculateTimeLeft(request.created_at);
          
          return {
            id: request.id,
            userName: getUserDisplayName(request.user_id),
            rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
            coin: request.crypto_type,
            amount: request.amount.toString(),
            rate: `₦${request.rate.toLocaleString()}/${request.crypto_type}`,
            nairaAmount: `₦${(request.cash_amount || request.amount * request.rate).toLocaleString()}`,
            timeLeft,
            paymentMethods: ['Bank Transfer', 'Cash Delivery', 'Cash Pickup'],
            type: request.direction === 'crypto_to_cash' ? 'sell' : 'buy',
            direction: request.direction === 'crypto_to_cash'
              ? 'User wants to sell crypto to you'
              : 'User wants to buy crypto from you',
            status: request.status,
            created_at: request.created_at,
            isPremium: Math.random() > 0.3 // 70% chance of premium user
          };
        });

        setTradeRequests(transformedRequests);
      } catch (error) {
        console.error('Error loading trade requests:', error);
        setError('Failed to load trade requests');
        toast({
          title: "Error",
          description: "Failed to load trade requests. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadTradeRequests();
  }, [user, toast]);

  const calculateTimeLeft = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${Math.max(1, 60 - diffInMinutes)}m left`;
    } else if (diffInMinutes < 1440) {
      const hoursLeft = Math.max(1, 24 - Math.floor(diffInMinutes / 60));
      return `${hoursLeft}h left`;
    } else {
      return 'Expired';
    }
  };

  const getUserDisplayName = (userId: string): string => {
    const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis'];
    const index = userId.length % names.length;
    return names[index];
  };

  const handleAcceptTrade = (requestId: string) => {
    const request = tradeRequests.find(r => r.id === requestId);
    navigate('/premium-trade-request-details', { 
      state: { request }
    });
  };

  const filteredRequests = tradeRequests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoin = coinFilter === 'all' || request.coin === coinFilter;
    return matchesSearch && matchesCoin;
  });

  const availableCoins = [...new Set(tradeRequests.map(r => r.coin))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading premium trade requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowUpDown size={24} className="mr-2 text-gray-600" />
              Trade Requests
            </h1>
            <p className="text-gray-600 text-sm">Premium incoming trade requests</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="p-4">
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Premium Request Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredRequests.length}</div>
              <div className="text-xs text-gray-600">Active Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredRequests.filter(r => r.isPremium).length}</div>
              <div className="text-xs text-gray-600">Premium Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Code Alert */}
      {activeCode && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold text-red-900">Active Order Code</div>
                <div className="text-sm text-red-700">
                  {activeCode.orderType === 'pickup' ? 'Cash Pickup' : 'Cash Delivery'} - {activeCode.amount} {activeCode.currency}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-900">{activeCode.code}</div>
              <div className="text-xs text-red-600">Show this code to collect</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="px-4 pb-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={coinFilter} onValueChange={setCoinFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coins</SelectItem>
              {availableCoins.map(coin => (
                <SelectItem key={coin} value={coin}>{coin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trade Requests List */}
      <div className="px-4 space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trade Requests</h3>
              <p className="text-gray-600">You don't have any pending trade requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const isUserBuyingCrypto = request.type === 'buy';
            const merchantAction = isUserBuyingCrypto ? 'Send Crypto' : 'Send Cash';
            const userAction = isUserBuyingCrypto ? 'Send Cash' : 'Send Crypto';
            
            return (
              <Card key={request.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleAcceptTrade(request.id)}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 relative">
                        <ArrowUpDown size={16} className="text-gray-600" />
                        {request.isPremium && (
                          <Crown size={12} className="absolute -top-1 -right-1 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 text-sm">{request.userName}</h4>
                          {request.isPremium && (
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                              Premium
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star size={12} className="text-yellow-400 mr-1 fill-current" />
                          <span className="text-xs text-gray-500">{request.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 text-xs">
                        <Clock size={12} className="mr-1" />
                        {request.timeLeft}
                      </div>
                      {request.isPremium && (
                        <div className="flex items-center text-yellow-600 text-xs mt-1">
                          <Zap size={12} className="mr-1" />
                          Priority
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Amount</p>
                      <div className="flex items-center">
                        <CryptoIcon symbol={request.coin} size={16} className="mr-1" />
                        <p className="font-semibold text-gray-900 text-sm">{request.amount} {request.coin}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Rate</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.rate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Value</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.nairaAmount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Payment Methods</p>
                      <p className="font-semibold text-gray-900 text-sm">{request.paymentMethods.length} options</p>
                    </div>
                  </div>

                  {/* Action Required */}
                  <div className={`${request.isPremium ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 mb-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isUserBuyingCrypto ? (
                          <Coins size={16} className={`${request.isPremium ? 'text-yellow-600' : 'text-gray-600'} mr-2`} />
                        ) : (
                          <Banknote size={16} className={`${request.isPremium ? 'text-yellow-600' : 'text-gray-600'} mr-2`} />
                        )}
                        <span className={`text-sm font-semibold ${request.isPremium ? 'text-yellow-800' : 'text-gray-800'}`}>
                          You need to: {merchantAction}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs ${request.isPremium ? 'text-yellow-700' : 'text-gray-700'} mt-1`}>
                      User will: {userAction}
                    </p>
                  </div>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptTrade(request.id);
                    }}
                    className={`w-full py-2 text-sm ${
                      request.isPremium 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    } text-white`}
                  >
                    {request.isPremium && <Crown size={14} className="mr-2" />}
                    Accept Trade Request
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTradeRequests;
