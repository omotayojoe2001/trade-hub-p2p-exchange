import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Zap, CheckCircle, Users, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { merchantService } from '@/services/merchantService';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumAutoMerchantMatch = () => {
  const [isMatching, setIsMatching] = useState(true);
  const [matchedMerchant, setMatchedMerchant] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { coinType, mode, amount, nairaAmount, selectedCoin, coinData } = location.state || {};

  useEffect(() => {
    const matchingTimer = setTimeout(() => {
      findBestMerchant();
    }, 2000); // Faster premium matching

    return () => clearTimeout(matchingTimer);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && matchedMerchant) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, matchedMerchant]);

  const findBestMerchant = async () => {
    try {
      const merchants = await merchantService.getMerchants(user?.id);
      
      if (merchants && merchants.length > 0) {
        const bestMerchant = selectBestMerchant(merchants);
        setMatchedMerchant(bestMerchant);
      } else {
        setMatchedMerchant(null);
      }
      
      setIsMatching(false);
    } catch (error) {
      console.error('Error in premium auto-matching:', error);
      setMatchedMerchant(null);
      setIsMatching(false);
    }
  };

  const selectBestMerchant = (merchants: any[]) => {
    const merchantsWithScores = merchants.map(merchant => ({
      ...merchant,
      rating: 4.7 + Math.random() * 0.3, // Premium merchants have higher ratings
      response_time: Math.floor(Math.random() * 10) + 3, // 3-13 minutes (faster)
      completion_rate: 97 + Math.random() * 3, // 97-100%
      total_trades: Math.floor(Math.random() * 800) + 200, // 200-1000 trades
      is_online: Math.random() > 0.2, // 80% chance online
      is_premium_merchant: true,
      score: 0
    }));

    merchantsWithScores.forEach(merchant => {
      merchant.score = 
        (merchant.rating / 5) * 0.35 + // 35% weight on rating (higher for premium)
        (merchant.is_online ? 1 : 0.5) * 0.3 + // 30% weight on online status
        ((15 - merchant.response_time) / 15) * 0.25 + // 25% weight on response time
        (merchant.completion_rate / 100) * 0.1; // 10% weight on completion rate
    });

    merchantsWithScores.sort((a, b) => b.score - a.score);
    return merchantsWithScores[0];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (!matchedMerchant) return;
    
    if (matchedMerchant.user_id === user?.id) {
      toast({
        title: "Error",
        description: "You cannot trade with yourself",
        variant: "destructive"
      });
      return;
    }
    
    if (mode === 'buy') {
      navigate('/premium-buy-crypto-payment-step1', {
        state: {
          coinType: coinType || 'BTC',
          selectedMerchant: matchedMerchant,
          amount,
          nairaAmount,
          mode
        }
      });
    } else if (mode === 'sell') {
      navigate('/premium-sell-crypto-payment-step1', {
        state: {
          coinType: coinType || 'BTC',
          selectedMerchant: matchedMerchant,
          amount,
          nairaAmount,
          mode
        }
      });
    }
  };

  const handleFindAnother = () => {
    setIsMatching(true);
    setMatchedMerchant(null);
    setTimeout(() => {
      findBestMerchant();
    }, 1500); // Faster for premium
  };

  if (!isMatching && !matchedMerchant) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex items-center p-4 bg-white/90 backdrop-blur-sm border-b border-yellow-200">
          <button onClick={() => navigate('/premium-merchant-matching-choice', { state: location.state })} className="mr-3">
            <ArrowLeft size={20} className="text-yellow-700" />
          </button>
          <div className="flex items-center">
            <Crown size={20} className="text-yellow-600 mr-2" />
            <h1 className="text-lg font-semibold text-yellow-900">No Premium Merchants</h1>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              No Premium Merchants Available
            </h2>
            <p className="text-yellow-700 mb-4">
              No premium merchants are currently available for auto-matching. Please try manual selection.
            </p>
            <Button
              onClick={() => navigate('/premium-merchant-list', { state: location.state })}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white"
            >
              <Crown size={16} className="mr-2" />
              Browse Premium Merchants
            </Button>
          </div>
        </div>
        <PremiumBottomNavigation />
      </div>
    );
  }

  if (isMatching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pb-20">
        <div className="flex items-center p-4 bg-white/90 backdrop-blur-sm border-b border-yellow-200">
          <button onClick={() => navigate('/premium-merchant-matching-choice', { state: location.state })} className="mr-3">
            <ArrowLeft size={20} className="text-yellow-700" />
          </button>
          <div className="flex items-center">
            <Crown size={20} className="text-yellow-600 mr-2" />
            <h1 className="text-lg font-semibold text-yellow-900">Finding Premium Merchant</h1>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-yellow-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              Premium AI Matching
            </h2>
            <p className="text-yellow-700">
              Finding the best premium merchant for your {mode} order...
            </p>
          </div>

          <div className="space-y-3 text-left max-w-sm mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-700">Analyzing premium merchant ratings</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-700">Checking premium response times</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-700">Finding exclusive premium rates</span>
            </div>
          </div>
        </div>
        <PremiumBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pb-20">
      <div className="flex items-center p-4 bg-white/90 backdrop-blur-sm border-b border-yellow-200">
        <button onClick={() => navigate('/premium-merchant-matching-choice', { state: location.state })} className="mr-3">
          <ArrowLeft size={20} className="text-yellow-700" />
        </button>
        <div className="flex items-center">
          <Crown size={20} className="text-yellow-600 mr-2" />
          <h1 className="text-lg font-semibold text-yellow-900">Premium Merchant Matched!</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-100 to-yellow-100 border border-green-300 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 mb-1 flex items-center">
                <Crown size={16} className="mr-1" />
                Perfect Premium Match Found!
              </p>
              <p className="text-sm text-green-700">
                Our AI found the best premium merchant for your {mode} order with exclusive rates.
              </p>
            </div>
          </div>
        </div>

        {/* Matched Merchant Card */}
        <Card className="mb-6 bg-white/90 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-lg font-semibold">
                  {matchedMerchant?.display_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Crown size={16} className="text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-900">
                    {matchedMerchant?.display_name || 'Premium Merchant'}
                  </h3>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Premium Verified
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-yellow-700">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{matchedMerchant?.rating?.toFixed(1) || '4.9'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-blue-500 mr-1" />
                    <span>~{matchedMerchant?.response_time || 5} min</span>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-yellow-600">Completion Rate</span>
                <p className="font-semibold text-green-600">
                  {matchedMerchant?.completion_rate?.toFixed(1) || '99.2'}%
                </p>
              </div>
              <div>
                <span className="text-yellow-600">Premium Trades</span>
                <p className="font-semibold text-yellow-900">
                  {matchedMerchant?.total_trades || 567}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer */}
        <Card className="mb-6 bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-orange-800 mb-2 flex items-center justify-center">
              <Crown size={14} className="mr-1" />
              Premium match expires in:
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {formatTime(timeLeft)}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold rounded-lg"
          >
            <Crown size={16} className="mr-2" />
            Continue with Premium Merchant
          </Button>
          
          <Button
            onClick={handleFindAnother}
            variant="outline"
            className="w-full h-12 border-yellow-300 text-yellow-700 font-semibold rounded-lg hover:bg-yellow-50"
          >
            Find Another Premium Merchant
          </Button>
        </div>

        <p className="text-center text-sm text-yellow-600 mt-4">
          Premium AI-matched based on exclusive rates, fastest response, and highest ratings
        </p>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumAutoMerchantMatch;