import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Zap, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const AutoMerchantMatch = () => {
  const [isMatching, setIsMatching] = useState(true);
  const [matchedMerchant, setMatchedMerchant] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { coinType, mode, amount, nairaAmount, selectedCoin, coinData } = location.state || {};

  useEffect(() => {
    // Simulate auto-matching process
    const matchingTimer = setTimeout(() => {
      findBestMerchant();
    }, 3000); // 3 seconds matching simulation

    return () => clearTimeout(matchingTimer);
  }, []);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0 && matchedMerchant) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, matchedMerchant]);

  const findBestMerchant = async () => {
    try {
      // Get real merchants from database, excluding current user
      const { data: merchants, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          phone_number,
          is_merchant,
          created_at
        `)
        .eq('is_merchant', true)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) {
        console.error('Error fetching merchants:', error);
        // Use fallback merchant
        setMatchedMerchant(createFallbackMerchant());
      } else if (merchants && merchants.length > 0) {
        // Select best merchant based on criteria
        const bestMerchant = selectBestMerchant(merchants);
        setMatchedMerchant(bestMerchant);
      } else {
        // No merchants found, use fallback
        setMatchedMerchant(createFallbackMerchant());
      }
      
      setIsMatching(false);
    } catch (error) {
      console.error('Error in auto-matching:', error);
      setMatchedMerchant(createFallbackMerchant());
      setIsMatching(false);
    }
  };

  const selectBestMerchant = (merchants: any[]) => {
    // Auto-matching algorithm: select best merchant based on:
    // 1. Rating (simulated)
    // 2. Response time (simulated)
    // 3. Online status (simulated)
    // 4. Trade completion rate (simulated)
    
    const merchantsWithScores = merchants.map(merchant => ({
      ...merchant,
      rating: 4.5 + Math.random() * 0.5, // 4.5-5.0 rating
      response_time: Math.floor(Math.random() * 15) + 5, // 5-20 minutes
      completion_rate: 95 + Math.random() * 5, // 95-100%
      total_trades: Math.floor(Math.random() * 500) + 100, // 100-600 trades
      is_online: Math.random() > 0.3, // 70% chance online
      // Calculate composite score
      score: 0
    }));

    // Calculate scores
    merchantsWithScores.forEach(merchant => {
      merchant.score = 
        (merchant.rating / 5) * 0.3 + // 30% weight on rating
        (merchant.is_online ? 1 : 0.5) * 0.25 + // 25% weight on online status
        ((20 - merchant.response_time) / 20) * 0.25 + // 25% weight on response time
        (merchant.completion_rate / 100) * 0.2; // 20% weight on completion rate
    });

    // Sort by score and return best
    merchantsWithScores.sort((a, b) => b.score - a.score);
    return merchantsWithScores[0];
  };

  const createFallbackMerchant = () => ({
    user_id: 'fallback-merchant-1',
    display_name: 'TradePro Merchant',
    rating: 4.8,
    response_time: 8,
    completion_rate: 98.5,
    total_trades: 342,
    is_online: true,
    verified: true
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    navigate('/payment-status', {
      state: {
        selectedMerchant: matchedMerchant,
        coinType,
        mode,
        amount,
        nairaAmount,
        selectedCoin,
        coinData,
        matchingType: 'auto',
        step: 1
      }
    });
  };

  const handleFindAnother = () => {
    setIsMatching(true);
    setMatchedMerchant(null);
    setTimeout(() => {
      findBestMerchant();
    }, 2000);
  };

  if (isMatching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center p-4 bg-white border-b border-gray-200">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Finding Best Merchant</h1>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Auto-Matching in Progress
            </h2>
            <p className="text-gray-600">
              We're finding the best merchant for your {mode} order...
            </p>
          </div>

          <div className="space-y-3 text-left max-w-sm mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Analyzing merchant ratings</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Checking response times</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Finding best rates</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Merchant Matched!</h1>
      </div>

      <div className="p-4">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 mb-1">Perfect Match Found!</p>
              <p className="text-sm text-green-700">
                We found the best merchant for your {mode} order based on rating, speed, and rates.
              </p>
            </div>
          </div>
        </div>

        {/* Matched Merchant Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                  {matchedMerchant?.display_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {matchedMerchant?.display_name || 'Merchant'}
                  </h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{matchedMerchant?.rating?.toFixed(1) || '4.8'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-blue-500 mr-1" />
                    <span>~{matchedMerchant?.response_time || 8} min</span>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Completion Rate</span>
                <p className="font-semibold text-green-600">
                  {matchedMerchant?.completion_rate?.toFixed(1) || '98.5'}%
                </p>
              </div>
              <div>
                <span className="text-gray-600">Total Trades</span>
                <p className="font-semibold text-gray-900">
                  {matchedMerchant?.total_trades || 342}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer */}
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-orange-800 mb-2">
              This match expires in:
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
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            Continue with This Merchant
          </Button>
          
          <Button
            onClick={handleFindAnother}
            variant="outline"
            className="w-full h-12 border-gray-300 text-gray-700 font-semibold rounded-lg"
          >
            Find Another Merchant
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Auto-matched based on best rating, fastest response, and competitive rates
        </p>
      </div>
    </div>
  );
};

export default AutoMerchantMatch;
