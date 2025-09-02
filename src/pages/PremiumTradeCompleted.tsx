import React from 'react';
import { ArrowLeft, Crown, CheckCircle, Star, Trophy, Gift } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumTradeCompleted = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-trades" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Trophy size={24} className="mr-2 text-yellow-600" />
                Trade Completed
              </h1>
              <p className="text-gray-600 text-sm">Your premium trade was successful</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Success Animation */}
        <Card className="p-8 bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">🎉 Trade Successful!</h2>
          <p className="text-green-700 mb-4">Your premium trade has been completed successfully with enhanced security and priority processing.</p>
          
          <div className="bg-white rounded-lg p-4 inline-block">
            <div className="flex items-center justify-center space-x-2">
              <Crown size={16} className="text-yellow-500" />
              <span className="font-semibold text-gray-900">Premium Trade Benefits Applied</span>
            </div>
          </div>
        </Card>

        {/* Trade Summary */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Star size={20} className="mr-2 text-yellow-500" />
            Trade Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Trade Type:</span>
              <span className="font-medium text-gray-900">Premium Buy Order</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">0.05 BTC</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-medium text-gray-900">₦7,511,725</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-700">Processing Time:</span>
              <span className="font-medium text-yellow-900">3x Faster (Premium)</span>
            </div>
          </div>
        </Card>

        {/* Premium Benefits Earned */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <Gift size={20} className="mr-2" />
            Premium Benefits Earned
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Priority processing completed</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Enhanced security protection applied</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Premium support access maintained</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Trade history updated with premium status</span>
            </div>
          </div>
        </Card>

        {/* Rating Section */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Rate Your Experience</h3>
          <p className="text-gray-600 text-sm mb-4">How was your premium trading experience?</p>
          
          <div className="flex justify-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 flex items-center justify-center transition-colors"
              >
                <Star size={20} className="text-yellow-500 fill-current" />
              </button>
            ))}
          </div>
          
          <Button variant="outline" className="w-full">
            Submit Rating
          </Button>
        </Card>

        {/* Next Steps */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/premium-trades')}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Crown size={16} className="mr-2" />
              View All Premium Trades
            </Button>
            <Button
              onClick={() => navigate('/premium-trade')}
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Start Another Premium Trade
            </Button>
            <Button
              onClick={() => navigate('/premium-referral')}
              variant="outline"
              className="w-full"
            >
              <Gift size={16} className="mr-2" />
              Refer Friends & Earn
            </Button>
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Trade Secured</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your trade was protected by our premium security protocols. All transactions are recorded and verified for your safety.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTradeCompleted;
