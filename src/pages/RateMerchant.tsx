import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, MessageSquare, Clock, Shield, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RatingData {
  rating: number;
  communication_rating: number;
  speed_rating: number;
  reliability_rating: number;
  review_text: string;
}

const RateMerchant = () => {
  const [ratings, setRatings] = useState<RatingData>({
    rating: 0,
    communication_rating: 0,
    speed_rating: 0,
    reliability_rating: 0,
    review_text: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get trade and merchant info from navigation state
  const { tradeId, merchantId, merchantName } = location.state || {};

  useEffect(() => {
    if (!tradeId || !merchantId) {
      navigate('/my-trades');
    }
  }, [tradeId, merchantId, navigate]);

  const handleStarClick = (category: keyof RatingData, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const updateMerchantRating = async (merchantId: string) => {
    try {
      // Calculate average rating for the merchant
      const { data: ratings, error: ratingsError } = await supabase
        .from('merchant_ratings')
        .select('rating, communication_rating, speed_rating, reliability_rating')
        .eq('merchant_id', merchantId);

      if (ratingsError) throw ratingsError;

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        const avgCommunication = ratings.filter(r => r.communication_rating).reduce((sum, r) => sum + (r.communication_rating || 0), 0) / ratings.filter(r => r.communication_rating).length || 0;
        const avgSpeed = ratings.filter(r => r.speed_rating).reduce((sum, r) => sum + (r.speed_rating || 0), 0) / ratings.filter(r => r.speed_rating).length || 0;
        const avgReliability = ratings.filter(r => r.reliability_rating).reduce((sum, r) => sum + (r.reliability_rating || 0), 0) / ratings.filter(r => r.reliability_rating).length || 0;

        // Update user profile with new ratings
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            rating: Number(avgRating.toFixed(2)),
            communication_rating: Number(avgCommunication.toFixed(2)),
            speed_rating: Number(avgSpeed.toFixed(2)),
            reliability_rating: Number(avgReliability.toFixed(2)),
            total_ratings: ratings.length
          })
          .eq('user_id', merchantId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating merchant rating:', error);
    }
  };

  const submitRating = async () => {
    if (ratings.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('merchant_ratings')
        .insert({
          trade_id: tradeId,
          merchant_id: merchantId,
          customer_id: user.id,
          rating: ratings.rating,
          communication_rating: ratings.communication_rating || null,
          speed_rating: ratings.speed_rating || null,
          reliability_rating: ratings.reliability_rating || null,
          review_text: ratings.review_text || null
        });

      if (error) throw error;

      // Update merchant's average rating
      await updateMerchantRating(merchantId);

      toast({
        title: "Rating submitted!",
        description: "Thank you for your feedback.",
      });

      navigate('/my-trades');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (
    category: keyof RatingData,
    title: string,
    icon: React.ReactNode,
    color: string
  ) => (
    <Card className="p-4">
      <div className="flex items-center mb-3">
        <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center mr-3`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(category, star)}
            className="focus:outline-none"
          >
            <Star
              size={32}
              className={`transition-colors ${
                star <= Number(ratings[category])
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        {Number(ratings[category]) > 0 && (
          <span>{ratings[category]} out of 5 stars</span>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/my-trades" className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Rate Merchant</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Merchant Info */}
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              <User size={24} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{merchantName || 'Merchant'}</h2>
              <p className="text-gray-600">How was your trading experience?</p>
            </div>
          </div>
        </Card>

        {/* Overall Rating */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick('rating', star)}
                className="focus:outline-none"
              >
                <Star
                  size={40}
                  className={`transition-colors ${
                    star <= ratings.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <div className="text-center">
            {ratings.rating > 0 && (
              <div className="text-lg font-semibold text-gray-900">
                {ratings.rating} out of 5 stars
              </div>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Tap the stars to rate your overall experience
            </p>
          </div>
        </Card>

        {/* Detailed Ratings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Ratings (Optional)</h3>
          
          {renderStarRating(
            'communication_rating',
            'Communication',
            <MessageSquare size={16} className="text-white" />,
            'bg-blue-500'
          )}
          
          {renderStarRating(
            'speed_rating',
            'Response Speed',
            <Clock size={16} className="text-white" />,
            'bg-green-500'
          )}
          
          {renderStarRating(
            'reliability_rating',
            'Reliability',
            <Shield size={16} className="text-white" />,
            'bg-purple-500'
          )}
        </div>

        {/* Review Text */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Written Review (Optional)</h3>
          <Textarea
            placeholder="Share your experience with other traders..."
            value={ratings.review_text}
            onChange={(e) => setRatings(prev => ({ ...prev, review_text: e.target.value }))}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Your review will help other traders make informed decisions
          </p>
        </Card>

        {/* Rating Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Rating Guidelines</h4>
          <div className="space-y-1 text-sm text-blue-700">
                      <p><Star className="w-4 h-4 inline mr-1" /> 1 star: Poor experience, would not recommend</p>
          <p><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /> 2 stars: Below average, some issues</p>
          <p><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /> 3 stars: Average experience</p>
          <p><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /> 4 stars: Good experience, minor issues</p>
          <p><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /><Star className="w-4 h-4 inline mr-1" /> 5 stars: Excellent experience, highly recommend</p>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={submitRating}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          disabled={loading || ratings.rating === 0}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </Button>

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={() => navigate('/my-trades')}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateMerchant;