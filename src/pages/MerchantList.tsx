import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Filter, MapPin, Clock, Star, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { merchantService, MerchantProfile } from '@/services/merchantService';
import { useAuth } from '@/hooks/useAuth';
import { merchantTradeService } from '@/services/merchantTradeService';

const MerchantList = () => {
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

  // Fetch real merchants from database using merchant service
  useEffect(() => {
    if (user?.id) {
      fetchMerchants();

      // Set up real-time subscription for merchant updates
      const channel = merchantService.subscribeToMerchantUpdates(async () => {
        // Refresh merchant list excluding current user
        const updatedMerchants = await merchantService.getMerchants(user.id);
        setMerchants(updatedMerchants);
        setFilteredMerchants(updatedMerchants);
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]); // Add user.id as dependency

  const fetchMerchants = async () => {
    if (!user?.id) {
      console.log('No user ID available for merchant fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching merchants excluding user:', user.id.slice(0, 8) + '...');

      // Exclude current user from merchant list
      const merchantsData = await merchantService.getMerchants(user.id);

      console.log('Found merchants:', merchantsData.length);
      setMerchants(merchantsData);
      setFilteredMerchants(merchantsData);

      if (merchantsData.length === 0) {
        toast({
          title: "No merchants available",
          description: "No merchants are currently online. Please try again later.",
        });
      }

    } catch (err) {
      console.error('Error fetching merchants:', err);
      setError('Failed to load merchants. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load merchants. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSelect = (merchantId: string) => {
    // Find merchant by user_id (not id)
    const selectedMerchant = merchants.find(m => m.user_id === merchantId);
    if (!selectedMerchant) {
      toast({
        title: "Error",
        description: "Selected merchant not found",
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

    // Prevent users from selecting themselves
    if (selectedMerchant.user_id === user.id) {
      toast({
        title: "Error",
        description: "You cannot trade with yourself",
        variant: "destructive"
      });
      return;
    }

    // Navigate to appropriate payment step based on mode
    if (mode === 'buy') {
      navigate('/buy-crypto-payment-step1', {
        state: {
          selectedMerchant,
          amount,
          nairaAmount,
          coinType,
          mode
        }
      });
    } else if (mode === 'sell') {
      navigate('/sell-crypto-payment-step1', {
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

  // Apply filters when sortBy changes
  useEffect(() => {
    let sorted = [...merchants];
    
    switch (sortBy) {
      case 'best-rate':
        sorted = sorted.sort((a, b) => a.rating - b.rating); // Lower rates first
        break;
      case 'fastest':
        sorted = sorted.sort((a, b) => a.avg_response_time_minutes - b.avg_response_time_minutes);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMerchants} className="bg-blue-500 hover:bg-blue-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate('/merchant-matching-choice', { state: location.state })} className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Merchant List</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Bell size={24} className="text-gray-600" />
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 bg-gray-800 text-white border-gray-700">
              <SelectValue placeholder="Sort by: Best Rate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best-rate">Sort by: Best Rate</SelectItem>
              <SelectItem value="fastest">Sort by: Fastest</SelectItem>
              <SelectItem value="highest-rated">Sort by: Highest Rated</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="bg-gray-800 text-white border-gray-700">
            <Filter size={16} />
          </Button>
        </div>

        {/* Filter Tags */}
        <div className="flex space-x-2 mt-3">
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Online</span>
          <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full flex items-center">
            <Star size={12} className="mr-1" />
            Good Reviews
          </span>
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">Low Rates</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border-b border-gray-100">
        <div className="flex items-start">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
          </div>
          <p className="text-sm text-gray-700">
            Select merchants with high ratings and fast payout history. You can always report issues from the transaction screen.
          </p>
        </div>
      </div>

      {/* Merchant List */}
      <div className="p-4 space-y-4 pb-20">
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Merchants Available</h3>
            <p className="text-gray-600 mb-4">
              No merchants are currently online in your area. Try again later or check back soon.
            </p>
            <Button onClick={fetchMerchants} variant="outline">
              Refresh
            </Button>
          </div>
        ) : (
          filteredMerchants.map((merchant) => (
            <Card key={merchant.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              {/* Merchant Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                    {(() => {
                      console.log(`Merchant ${merchant.display_name} avatar_url:`, merchant.avatar_url);
                      return merchant.avatar_url ? (
                        <img
                          src={merchant.avatar_url}
                          alt={merchant.display_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Image load error for:', merchant.avatar_url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600">
                          {getAvatarInitials(merchant.display_name)}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{merchant.display_name}</h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={`${
                            i < Math.floor(merchant.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">{merchant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <span className={`${getStatusColor(merchant.is_online)} text-white text-xs px-2 py-1 rounded-full`}>
                  {getStatusText(merchant.is_online)}
                </span>
              </div>

              {/* Merchant Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-blue-500 font-medium mb-1">Total Trades</p>
                  <p className="text-sm font-semibold text-gray-800">{merchant.trade_count}</p>
                  <p className="text-xs text-blue-500 font-medium mb-1 mt-2">Payment Methods</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {merchant.payment_methods.slice(0, 2).join(', ')}
                    {merchant.payment_methods.length > 2 && ` +${merchant.payment_methods.length - 2}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-500 font-medium mb-1">Total Volume</p>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(merchant.total_volume)}</p>
                  <p className="text-xs text-blue-500 font-medium mb-1 mt-2">Response Time</p>
                  <p className="text-sm font-semibold text-gray-800">{merchant.avg_response_time_minutes} mins</p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleMerchantSelect(merchant.user_id)}
                className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
                disabled={!merchant.is_online}
              >
                {merchant.is_online ? 'Select This Merchant' : 'Merchant Offline'}
              </Button>
            </Card>
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MerchantList;
