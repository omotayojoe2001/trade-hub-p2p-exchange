import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MessageCircle, Shield, Award, Calendar, TrendingUp, Users, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileData {
  id: string;
  display_name: string;
  user_type: string;
  is_merchant: boolean;
  profile_completed: boolean;
  created_at: string;
  phone_number?: string;
}

interface MerchantRating {
  id: string;
  rating: number;
  communication_rating?: number;
  speed_rating?: number;
  reliability_rating?: number;
  review_text?: string;
  created_at: string;
  customer_id: string;
  customer_name?: string;
}

interface TradeStats {
  total_trades: number;
  completed_trades: number;
  success_rate: number;
  avg_rating: number;
  total_ratings: number;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [ratings, setRatings] = useState<MerchantRating[]>([]);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserRatings();
      fetchTradeStats();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfileData({
          ...data,
          id: data.user_id
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_ratings')
        .select('*')
        .eq('merchant_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Fetch customer names separately
      const ratingsWithCustomerNames = [];
      if (data) {
        for (const rating of data) {
          const { data: customerProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', rating.customer_id)
            .single();
          
          ratingsWithCustomerNames.push({
            ...rating,
            customer_name: customerProfile?.display_name || 'Anonymous'
          });
        }
      }
      
      setRatings(ratingsWithCustomerNames);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchTradeStats = async () => {
    try {
      // Fetch trade statistics
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('status')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (tradesError) throw tradesError;

      // Fetch rating statistics
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('merchant_ratings')
        .select('overall_rating')
        .eq('merchant_id', userId);

      if (ratingsError) throw ratingsError;

      const totalTrades = trades?.length || 0;
      const completedTrades = trades?.filter(t => t.status === 'completed').length || 0;
      const successRate = totalTrades > 0 ? (completedTrades / totalTrades) * 100 : 0;
      const avgRating = ratingsData?.length > 0 
        ? ratingsData.reduce((sum, r) => sum + (r.overall_rating || 5), 0) / ratingsData.length 
        : 0;

      setTradeStats({
        total_trades: totalTrades,
        completed_trades: completedTrades,
        success_rate: successRate,
        avg_rating: avgRating,
        total_ratings: ratingsData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching trade stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMessage = () => {
    // Navigate to messages with this user
    navigate('/messages', { state: { startConversationWith: userId } });
  };

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const isPremiumUser = profileData.user_type === 'premium' || profileData.is_merchant;
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold">User Profile</h1>
        </div>
        {!isOwnProfile && (
          <Button size="sm" onClick={startMessage}>
            <MessageCircle size={16} className="mr-2" />
            Message
          </Button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.display_name}`} />
                <AvatarFallback>
                  {profileData.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-bold">{profileData.display_name}</h2>
                  {isPremiumUser && (
                    <Crown size={20} className="text-yellow-500" />
                  )}
                  {profileData.is_merchant && (
                    <Badge variant="secondary">
                      <Shield size={12} className="mr-1" />
                      Merchant
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    Member since {new Date(profileData.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                  {tradeStats && tradeStats.avg_rating > 0 && (
                    <div className="flex items-center">
                      <Star size={14} className="mr-1 text-yellow-500" />
                      {tradeStats.avg_rating.toFixed(1)} ({tradeStats.total_ratings} reviews)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Statistics */}
        {tradeStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp size={20} className="mr-2" />
                Trade Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{tradeStats.total_trades}</div>
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tradeStats.completed_trades}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tradeStats.success_rate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{tradeStats.avg_rating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews and Ratings */}
        {ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star size={20} className="mr-2" />
                Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-border pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rating.customer_name}`} />
                          <AvatarFallback>
                            {rating.customer_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{rating.customer_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          {renderRatingStars(rating.rating)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {rating.review_text && (
                      <p className="text-sm text-muted-foreground mb-2">{rating.review_text}</p>
                    )}
                    
                    {(rating.communication_rating || rating.speed_rating || rating.reliability_rating) && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {rating.communication_rating && (
                          <div>
                            <span className="text-muted-foreground">Communication: </span>
                            <span className="font-medium">{rating.communication_rating}/5</span>
                          </div>
                        )}
                        {rating.speed_rating && (
                          <div>
                            <span className="text-muted-foreground">Speed: </span>
                            <span className="font-medium">{rating.speed_rating}/5</span>
                          </div>
                        )}
                        {rating.reliability_rating && (
                          <div>
                            <span className="text-muted-foreground">Reliability: </span>
                            <span className="font-medium">{rating.reliability_rating}/5</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state for no ratings */}
        {ratings.length === 0 && profileData.is_merchant && (
          <Card>
            <CardContent className="p-6 text-center">
              <Star size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No reviews yet</h3>
              <p className="text-sm text-muted-foreground">
                This {profileData.is_merchant ? 'merchant' : 'user'} hasn't received any reviews yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfile;