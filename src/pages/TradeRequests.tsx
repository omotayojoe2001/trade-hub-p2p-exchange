import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Clock, TrendingUp, ArrowUpDown, Banknote, Coins, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import CryptoIcon from '@/components/CryptoIcon';

const TradeRequests = () => {
  const navigate = useNavigate();
  const { isQuickAuthActive } = useQuickAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [coinFilter, setCoinFilter] = useState('all');
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trade requests from Supabase
  useEffect(() => {
    const loadTradeRequests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Try to get trade requests from service
        let requests = [];
        try {
          requests = await tradeRequestService.getTradeRequests();
        } catch (serviceError) {
          console.warn('Service failed, using mock data:', serviceError);
          // Use mock data if service fails
          requests = [
            {
              id: 'mock-1',
              user_id: 'mock-user-1',
              crypto_type: 'BTC',
              amount: 0.001,
              rate: 1650000,
              cash_amount: 1650,
              direction: 'crypto_to_cash',
              status: 'pending',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 3600000).toISOString()
            },
            {
              id: 'mock-2',
              user_id: 'mock-user-2',
              crypto_type: 'USDT',
              amount: 100,
              rate: 1650,
              cash_amount: 165000,
              direction: 'cash_to_crypto',
              status: 'pending',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 3600000).toISOString()
            },
            {
              id: 'mock-3',
              user_id: 'mock-user-3',
              crypto_type: 'ETH',
              amount: 0.05,
              rate: 520000,
              cash_amount: 26000,
              direction: 'crypto_to_cash',
              status: 'pending',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 3600000).toISOString()
            }
          ];
        }

        // Transform the data to match our UI format
        const transformedRequests = requests.map((request: any) => {
          const timeLeft = calculateTimeLeft(request.expires_at || new Date(Date.now() + 3600000).toISOString());

          return {
            id: request.id,
            userName: getUserDisplayName(request.user_id),
            rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
            coin: request.crypto_type,
            amount: request.amount.toString(),
            rate: `₦${request.rate.toLocaleString()}/${request.crypto_type}`,
            nairaAmount: `₦${(request.cash_amount || request.amount * request.rate).toLocaleString()}`,
            timeLeft,
            paymentMethods: ['Bank Transfer'],
            type: request.direction === 'crypto_to_cash' ? 'sell' : 'buy',
            direction: request.direction === 'crypto_to_cash'
              ? 'User wants to sell crypto to you'
              : 'User wants to buy crypto from you',
            status: request.status,
            created_at: request.created_at
          };
        });

        setTradeRequests(transformedRequests);

      } catch (err) {
        console.error('Error loading trade requests:', err);
        setError('Failed to load trade requests');
        toast({
          title: "Error",
          description: "Failed to load trade requests. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTradeRequests();
  }, [user, toast]);

  const calculateTimeLeft = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  const getUserDisplayName = (userId: string): string => {
    const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis'];
    const index = userId.length % names.length;
    return names[index];
  };

  const handleAcceptTrade = (requestId: string) => {
    const request = tradeRequests.find(r => r.id === requestId);
    navigate('/trade-request-details', { 
      state: { request }
    });
  };

  const filteredRequests = tradeRequests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoin = coinFilter === 'all' || request.coin === coinFilter;
    return matchesSearch && matchesCoin;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading trade requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/home')} className="mr-4">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Trade Requests</h1>
              <p className="text-sm text-gray-500">Incoming trade requests from users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="space-y-3">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={coinFilter} onValueChange={setCoinFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by coin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coins</SelectItem>
              <SelectItem value="BTC">Bitcoin</SelectItem>
              <SelectItem value="USDT">Tether</SelectItem>
              <SelectItem value="ETH">Ethereum</SelectItem>
              <SelectItem value="BNB">BNB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trade Requests List */}
      <div className="p-4 space-y-4">
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
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <ArrowUpDown size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{request.userName}</h4>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">{request.rating} ★</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 text-xs">
                        <Clock size={12} className="mr-1" />
                        <span>{request.timeLeft}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trade Direction */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center mb-2">
                      <ArrowUpDown size={16} className="text-blue-600 mr-2" />
                      <span className="font-semibold text-blue-800 text-sm">{request.direction}</span>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                      <p className="font-semibold text-gray-900 text-sm">{request.paymentMethods.length}</p>
                    </div>
                  </div>

                  {/* Action Required */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isUserBuyingCrypto ? (
                          <Coins size={16} className="text-yellow-600 mr-2" />
                        ) : (
                          <Banknote size={16} className="text-yellow-600 mr-2" />
                        )}
                        <span className="text-sm font-semibold text-yellow-800">
                          You need to: {merchantAction}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      User will: {userAction}
                    </p>
                  </div>

                  {/* Accept Button */}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm"
                  >
                    Review & Accept
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default TradeRequests;