import React, { useEffect } from 'react';
import { Crown, CheckCircle, Star, Gift, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const CashOrderThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    orderType,
    code,
    amount,
    currency,
    estimatedTime
  } = location.state || {};

  // Start the global code tracker
  useEffect(() => {
    if (code) {
      const newCode = {
        code,
        orderType,
        amount,
        currency,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      // Get existing codes
      const existingCodes = localStorage.getItem('activeTradeCodes');
      let codesArray = [];

      if (existingCodes) {
        try {
          codesArray = JSON.parse(existingCodes);
        } catch (error) {
          console.error('Error parsing existing codes:', error);
        }
      }

      // Add new code if it doesn't exist
      const codeExists = codesArray.find((c: any) => c.code === code);
      if (!codeExists) {
        codesArray.push(newCode);
        localStorage.setItem('activeTradeCodes', JSON.stringify(codesArray));
      }

      // Also store single code for backward compatibility
      localStorage.setItem('activeTradeCode', JSON.stringify(newCode));

      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('newTradeCode', { detail: { code, orderType } }));
    }
  }, [code, orderType, amount, currency]);

  const getOrderTypeDisplay = () => {
    switch (orderType) {
      case 'pickup':
        return 'Cash Pickup';
      case 'delivery':
        return 'Cash Delivery';
      case 'usd-pickup':
        return 'USD Pickup';
      case 'usd-delivery':
        return 'USD Delivery';
      default:
        return 'Order';
    }
  };

  const getEstimatedTimeDisplay = () => {
    switch (orderType) {
      case 'pickup':
        return '1-3 hours';
      case 'delivery':
        return '2-6 hours';
      case 'usd-pickup':
        return '1-3 hours';
      case 'usd-delivery':
        return '2-6 hours';
      default:
        return estimatedTime || '2-4 hours';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckCircle size={24} className="mr-2 text-green-600" />
                Order Confirmed
              </h1>
              <p className="text-gray-600 text-sm">Thank you for your premium order</p>
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
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">🎉 Thank You!</h2>
          <p className="text-green-700 mb-4">
            Your {getOrderTypeDisplay()} order has been confirmed successfully.
          </p>
          
          <div className="bg-white rounded-lg p-4 inline-block">
            <div className="flex items-center justify-center space-x-2">
              <Crown size={16} className="text-yellow-500" />
              <span className="font-semibold text-gray-900">Premium Service Activated</span>
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Order Type:</span>
              <span className="font-medium text-gray-900">{getOrderTypeDisplay()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">{amount} {currency}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Your Code:</span>
              <span className="font-bold text-yellow-900 text-lg">{code}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-700">Estimated Time:</span>
              <span className="font-medium text-yellow-900">{getEstimatedTimeDisplay()}</span>
            </div>
          </div>
        </Card>

        {/* What Happens Next */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">What Happens Next?</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <div className="font-medium text-gray-900">Order Processing</div>
                <div className="text-sm text-gray-600">Your order is being processed with premium priority</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <div className="font-medium text-gray-900">Agent Assignment</div>
                <div className="text-sm text-gray-600">A premium agent will be assigned to your order</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <div className="font-medium text-gray-900">Notification</div>
                <div className="text-sm text-gray-600">You'll receive updates via phone and WhatsApp</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <div className="font-medium text-gray-900">Code Verification</div>
                <div className="text-sm text-gray-600">Show your code to receive your cash</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Star size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Important Notice</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Keep your code safe and don't share it with anyone</li>
                <li>• You'll see a blinking notification when your order is ready</li>
                <li>• Our agent will contact you 30 minutes before arrival</li>
                <li>• Have a valid ID ready for verification</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/premium-trades')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-12"
          >
            <Crown size={16} className="mr-2" />
            View My Premium Trades
          </Button>
          
          <Button
            onClick={() => navigate('/premium-trade')}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 h-12"
          >
            Start Another Trade
            <ArrowRight size={16} className="ml-2" />
          </Button>
          
          <Button
            onClick={() => navigate('/premium-referral')}
            variant="outline"
            className="w-full h-12"
          >
            <Gift size={16} className="mr-2" />
            Refer Friends & Earn Premium Rewards
          </Button>
        </div>

        {/* Rating Section */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Rate Your Experience</h3>
          <p className="text-gray-600 text-sm mb-4">How easy was it to place this order?</p>
          
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
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default CashOrderThankYou;
