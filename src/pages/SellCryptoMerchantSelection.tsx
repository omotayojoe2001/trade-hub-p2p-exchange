import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Star, Shield, Clock, Target, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';

interface Merchant {
  user_id: string;
  display_name: string;
  rating: number;
  total_trades: number;
  success_rate: number;
  avg_response_time: number;
  is_premium: boolean;
  merchant_mode: boolean;
}

const SellCryptoMerchantSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get sell crypto data from location state
  const sellData = location.state || {};
  const { amount, nairaAmount, cryptoType = 'USDT', rate } = sellData;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!amount || !nairaAmount) {
      toast({
        title: "Missing Information",
        description: "Please complete the sell crypto form first.",
        variant: "destructive"
      });
      navigate('/buy-sell');
      return;
    }

    fetchMerchants();
  }, [user, amount, nairaAmount]);

  useEffect(() => {
    const filtered = merchants.filter(merchant =>
      merchant.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMerchants(filtered);
  }, [merchants, searchQuery]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      
      // Fetch active merchants who are in merchant mode
      const { data: merchantsData, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          rating,
          is_premium,
          merchant_mode,
          is_merchant
        `)
        .eq('is_merchant', true)
        .eq('merchant_mode', true)
        .eq('is_active', true)
        .neq('user_id', user!.id);

      if (error) throw error;

      // Transform merchant data
      const transformedMerchants = merchantsData.map(merchant => ({
        user_id: merchant.user_id,
        display_name: merchant.display_name || 'Anonymous Merchant',
        rating: merchant.rating || 5.0,
        total_trades: Math.floor(Math.random() * 100) + 10, // Placeholder
        success_rate: 95 + Math.random() * 5, // Placeholder
        avg_response_time: Math.floor(Math.random() * 15) + 5, // Placeholder
        is_premium: merchant.is_premium || false,
        merchant_mode: merchant.merchant_mode
      }));

      setMerchants(transformedMerchants);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast({
        title: "Error",
        description: "Failed to load merchants. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMerchant = async (merchantId: string) => {
    try {
      // Create a trade request targeted to this specific merchant
      const { data: tradeRequest, error } = await supabase
        .from('trade_requests')
        .insert({
          user_id: user!.id,
          crypto_type: cryptoType,
          amount_crypto: parseFloat(amount),
          amount_fiat: parseFloat(nairaAmount.replace(/[^0-9.-]+/g, "")),
          rate: rate || 1650,
          trade_type: 'sell',
          payment_method: 'bank_transfer',
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      // Create merchant notification
      await supabase
        .from('merchant_notifications')
        .insert({
          trade_request_id: tradeRequest.id,
          merchant_id: merchantId,
          is_read: false
        });

      // Create general notification for the merchant
      await supabase
        .from('notifications')
        .insert({
          user_id: merchantId,
          type: 'trade_request',
          title: 'New Sell Crypto Request',
          message: `Someone wants to sell ${amount} ${cryptoType} for ${nairaAmount}`,
          data: {
            trade_request_id: tradeRequest.id,
            amount_crypto: amount,
            crypto_type: cryptoType,
            amount_fiat: nairaAmount,
            trade_type: 'sell'
          }
        });

      toast({
        title: "Request Sent!",
        description: "Your sell request has been sent to the merchant.",
      });

      // Navigate to the escrow step
      navigate('/sell-crypto-escrow', {
        state: {
          ...sellData,
          tradeRequestId: tradeRequest.id,
          merchantId,
          merchantName: merchants.find(m => m.user_id === merchantId)?.display_name
        }
      });
      
    } catch (error) {
      console.error('Error selecting merchant:', error);
      toast({
        title: "Error",
        description: "Failed to send request to merchant. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAutoMatch = async () => {
    if (merchants.length === 0) {
      toast({
        title: "No Merchants Available",
        description: "There are no active merchants available for auto-matching.",
        variant: "destructive"
      });
      return;
    }

    // Select a random merchant for auto-matching
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    await handleSelectMerchant(randomMerchant.user_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Finding available merchants...</p>
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
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Select Merchant</h1>
              <p className="text-sm text-gray-500">Choose who will buy your crypto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Summary */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Sell Order Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Amount:</span>
              <span className="font-semibold text-blue-900">{amount} {cryptoType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">You'll receive:</span>
              <span className="font-semibold text-blue-900">{nairaAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Rate:</span>
              <span className="font-semibold text-blue-900">NGN {rate?.toLocaleString()}/{cryptoType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Match Option */}
      <div className="p-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="text-green-600 mr-3" size={24} />
                <div>
                  <h3 className="font-semibold text-green-900">Quick Auto-Match</h3>
                  <p className="text-sm text-green-700">Get matched instantly with an available merchant</p>
                </div>
              </div>
              <Button 
                onClick={handleAutoMatch}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Auto Match
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Selection */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Merchants</h2>
          <Badge variant="secondary" className="flex items-center">
            <Users size={14} className="mr-1" />
            {merchants.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Merchants List */}
        <div className="space-y-3">
          {filteredMerchants.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Merchants Found</h3>
                <p className="text-gray-600">
                  {searchQuery ? 'No merchants match your search.' : 'No active merchants available right now.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMerchants.map((merchant) => (
              <Card key={merchant.user_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectMerchant(merchant.user_id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{merchant.display_name}</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star size={14} className="text-yellow-500 mr-1" />
                            <span className="text-sm text-gray-600">{merchant.rating.toFixed(1)}</span>
                          </div>
                          {merchant.is_premium && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield size={10} className="mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{merchant.total_trades} trades</p>
                      <p className="text-xs text-gray-500">{merchant.success_rate.toFixed(1)}% success</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={14} className="mr-1" />
                      <span>~{merchant.avg_response_time}min response</span>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Select Merchant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellCryptoMerchantSelection;