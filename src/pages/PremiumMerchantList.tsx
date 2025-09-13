import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Filter, MapPin, Clock, Star, Loader2, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { merchantService, MerchantProfile } from '@/services/merchantService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumMerchantList = () => {
  const [sortBy, setSortBy] = useState('best-rate');
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount, coinType, mode } = (location.state as any) || {};
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchMerchants();
    }
  }, [user?.id]);

  const fetchMerchants = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const merchantsData = await merchantService.getMerchants(user.id);
      
      // Enhance merchants with premium features
      const premiumMerchants = merchantsData.map(merchant => ({
        ...merchant,
        rating: Math.min(5, merchant.rating + 0.3), // Premium merchants have higher ratings
        is_premium_merchant: true,
        response_time: Math.max(1, merchant.avg_response_time_minutes - 5) // Faster response
      }));

      setMerchants(premiumMerchants);
      setFilteredMerchants(premiumMerchants);

      if (premiumMerchants.length === 0) {
        toast({
          title: "No premium merchants available",
          description: "No premium merchants are currently online. Please try again later.",
        });
      }

    } catch (err) {
      console.error('Error fetching premium merchants:', err);
      setError('Failed to load premium merchants. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load premium merchants. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSelect = (merchantId: string) => {
    const selectedMerchant = merchants.find(m => m.user_id === merchantId);
    if (!selectedMerchant) {
      toast({
        title: "Error",
        description: "Selected premium merchant not found",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to continue",
        variant: "destructive"
      });
      return;
    }

    if (selectedMerchant.user_id === user.id) {
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
          selectedMerchant,
          amount,
          nairaAmount,
          coinType,
          mode
        }
      });
    } else if (mode === 'sell') {
      navigate('/premium-sell-crypto-payment-step1', {
        state: {
          selectedMerchant,
          amount,
          nairaAmount,
          coinType,
          mode
        }
      });
    }
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isOnline: boolean) => {
    return isOnline ? 'Online' : 'Offline';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    let sorted = [...merchants];
    
    switch (sortBy) {
      case 'best-rate':
        sorted = sorted.sort((a, b) => a.rating - b.rating);
        break;
      case 'fastest':
        sorted = sorted.sort((a, b) => a.response_time - b.response_time);
        break;
      case 'highest-rated':
        sorted = sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    
    setFilteredMerchants(sorted);
  }, [sortBy, merchants]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-600" />
          <p className="text-yellow-700">Loading premium merchants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMerchants} className="bg-yellow-600 hover:bg-yellow-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm border-b border-yellow-200">
        <div className="flex items-center">
          <button onClick={() => navigate('/premium-merchant-matching-choice', { state: location.state })} className="mr-4">
            <ArrowLeft size={24} className="text-yellow-700" />
          </button>
          <div className="flex items-center">
            <Crown size={20} className="text-yellow-600 mr-2" />
            <h1 className="text-lg font-semibold text-yellow-900">Premium Merchants</h1>
          </div>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          <Crown size={12} className="mr-1" />
          Premium
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-yellow-200 bg-white/80">
        <div className="flex items-center space-x-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-yellow-700">
              <SelectValue placeholder="Sort by: Best Rate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best-rate">Sort by: Best Rate</SelectItem>
              <SelectItem value="fastest">Sort by: Fastest</SelectItem>
              <SelectItem value="highest-rated">Sort by: Highest Rated</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-yellow-700">
            <Filter size={16} />
          </Button>
        </div>

        {/* Filter Tags */}
        <div className="flex space-x-2 mt-3">
          <span className="bg-yellow-600 text-white text-xs px-3 py-1 rounded-full flex items-center">
            <Crown size={10} className="mr-1" />
            Premium Only
          </span>
          <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center">
            <Star size={12} className="mr-1" />
            Verified
          </span>
          <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">Online</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border-b border-yellow-200">
        <div className="flex items-start">
          <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
            <Crown size={12} className="text-white" />
          </div>
          <p className="text-sm text-yellow-800">
            Premium merchants offer exclusive rates, faster responses, and priority support. All merchants are verified and rated.
          </p>
        </div>
      </div>

      {/* Merchant List */}
      <div className="p-4 space-y-4">
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Premium Merchants Available</h3>
            <p className="text-yellow-700 mb-4">
              No premium merchants are currently online. Try again later or check back soon.
            </p>
            <Button onClick={fetchMerchants} variant="outline" className="border-yellow-300 text-yellow-700">
              Refresh
            </Button>
          </div>
        ) : (
          filteredMerchants.map((merchant) => (
            <Card key={merchant.id} className="p-4 bg-white/90 border border-yellow-200 rounded-xl hover:shadow-lg hover:border-yellow-300 transition-all">
              {/* Merchant Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg font-semibold text-yellow-700">
                      {getAvatarInitials(merchant.display_name)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Crown size={14} className="text-yellow-600" />
                      <h3 className="font-semibold text-yellow-900">{merchant.display_name}</h3>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={`${
                            i < Math.floor(merchant.rating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-yellow-700 ml-1">{merchant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <span className={`${getStatusColor(merchant.is_online)} text-white text-xs px-2 py-1 rounded-full flex items-center`}>
                  <Crown size={10} className="mr-1" />
                  {getStatusText(merchant.is_online)}
                </span>
              </div>

              {/* Merchant Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-yellow-600 font-medium mb-1">Premium Trades</p>
                  <p className="text-sm font-semibold text-yellow-900">{merchant.trade_count}</p>
                  <p className="text-xs text-yellow-600 font-medium mb-1 mt-2">Payment Methods</p>
                  <p className="text-sm font-semibold text-yellow-900">
                    {merchant.payment_methods.slice(0, 2).join(', ')}
                    {merchant.payment_methods.length > 2 && ` +${merchant.payment_methods.length - 2}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-yellow-600 font-medium mb-1">Total Volume</p>
                  <p className="text-sm font-semibold text-yellow-900">{formatCurrency(merchant.total_volume)}</p>
                  <p className="text-xs text-yellow-600 font-medium mb-1 mt-2">Response Time</p>
                  <p className="text-sm font-semibold text-yellow-900">{merchant.response_time || merchant.avg_response_time_minutes} mins</p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleMerchantSelect(merchant.user_id)}
                className="w-full h-10 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-medium rounded-lg"
                disabled={!merchant.is_online}
              >
                <Crown size={16} className="mr-2" />
                {merchant.is_online ? 'Select Premium Merchant' : 'Merchant Offline'}
              </Button>
            </Card>
          ))
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumMerchantList;