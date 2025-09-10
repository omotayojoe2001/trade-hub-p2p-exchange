import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, TrendingDown, RefreshCw, ArrowRight, Truck, CreditCard, MapPin, FileText, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { realTimeTradeRequestService } from '@/services/supabaseService';
import { useAuth } from '@/hooks/useAuth';

const PremiumTrade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real trade requests data
  useEffect(() => {
    const loadTradeRequests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const requests = await realTimeTradeRequestService.getOpenTradeRequests();

        // Transform for display
        const transformedRequests = requests.slice(0, 2).map((request: any) => ({
          id: request.id,
          userName: request.user_profiles?.full_name || 'Anonymous User',
          rating: request.user_profiles?.rating || 5.0,
          coin: request.coin_type,
          amount: request.amount.toString(),
          rate: `₦${request.rate.toLocaleString()}/${request.coin_type}`,
          timeLeft: calculateTimeLeft(request.expires_at),
          type: request.trade_type,
          isPremium: request.user_profiles?.verification_level === 'premium',
          originalRequest: request
        }));

        setTradeRequests(transformedRequests);
      } catch (error) {
        console.error('Error loading trade requests:', error);
        // Fallback to empty array
        setTradeRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadTradeRequests();
  }, [user]);

  const calculateTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m left`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m left`;
  };

  const tradeOptions = [
    {
      id: 'buy-crypto',
      title: 'Buy Crypto',
      description: 'Send Naira (cash/transfer) → Get crypto instantly',
      icon: <TrendingUp size={32} className="text-green-600" />,
      action: () => navigate('/select-coin', { state: { mode: 'buy' } }),
      features: ['Instant delivery', 'Best rates', 'Priority matching']
    },
    {
      id: 'sell-crypto',
      title: 'Sell Crypto',
      description: 'Send crypto → Get cash',
      icon: <TrendingDown size={32} className="text-blue-600" />,
      action: () => navigate('/sell-for-cash'),
      features: ['Bank Transfer (default)', 'Cash Pickup (premium)', 'Cash Delivery (premium)']
    },
    {
      id: 'naira-to-usd',
      title: 'Send Naira, Get USD',
      description: 'Send Naira → Receive USD',
      icon: <RefreshCw size={32} className="text-purple-600" />,
      action: () => navigate('/send-naira-get-usd'),
      features: ['Pickup (premium)', 'Delivery (premium)', 'Best exchange rates']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp size={24} className="mr-2 text-gray-600" />
              Premium Trading
            </h1>
            <p className="text-gray-600 text-sm">Choose your trading option</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/premium-trade-requests')}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <FileText size={16} className="mr-1" />
              Requests
            </Button>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
              <Crown size={12} className="mr-1" />
              Premium
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Welcome Message */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">What would you like to do?</h3>
          <p className="text-gray-600 text-sm">Choose from our premium trading options below</p>
        </Card>

        {/* Trading Options */}
        <div className="space-y-4">
          {tradeOptions.map((option) => (
            <Card
              key={option.id}
              onClick={option.action}
              className="p-6 bg-white border-gray-200 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                    <ArrowRight size={20} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-3">{option.description}</p>
                  <div className="space-y-1">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate('/premium-trades')}
              variant="outline"
              className="h-12"
            >
              <Crown size={16} className="mr-2 text-yellow-600" />
              My Premium Trades
            </Button>
            <Button
              onClick={() => navigate('/trending-coins')}
              variant="outline"
              className="h-12"
            >
              <TrendingUp size={16} className="mr-2" />
              Trending Coins
            </Button>
          </div>
        </Card>

        {/* Recent Trade Requests */}
        {tradeRequests.length > 0 && (
          <Card className="p-4 bg-white border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Recent Trade Requests</h3>
              <Button
                onClick={() => navigate('/premium-trade-requests')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {tradeRequests.slice(0, 2).map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate('/premium-trade-requests')}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">{request.userName}</span>
                      {request.isPremium && (
                        <Crown size={12} className="text-yellow-500" />
                      )}
                      <div className="flex items-center">
                        <Star size={10} className="text-yellow-400 mr-1 fill-current" />
                        <span className="text-xs text-gray-500">{request.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-orange-600 text-xs">
                      <Clock size={12} className="mr-1" />
                      {request.timeLeft}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {request.type === 'buy' ? 'Wants to buy' : 'Wants to sell'} {request.amount} {request.coin}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{request.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTrade;
