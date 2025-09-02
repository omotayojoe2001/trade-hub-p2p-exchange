import React, { useState } from 'react';
import { ArrowLeft, Crown, Clock, Star, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumTradeRequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { request } = location.state || {};
  const [isAccepting, setIsAccepting] = useState(false);

  // Mock request data if none provided
  const tradeRequest = request || {
    id: 'TR-2024-001',
    userName: 'Sarah Wilson',
    rating: 4.8,
    coin: 'BTC',
    amount: '0.05',
    rate: '₦150,000,000/BTC',
    nairaAmount: '₦7,500,000',
    timeLeft: '23 minutes',
    paymentMethods: ['Bank Transfer', 'Cash Delivery', 'Cash Pickup'],
    type: 'sell',
    direction: 'User wants to sell crypto to you',
    status: 'active',
    isPremium: true,
    tradeHistory: 47,
    completionRate: 98.5,
    averageTime: '12 minutes',
    verificationLevel: 'Premium Verified'
  };

  const handleAcceptTrade = () => {
    setIsAccepting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Trade Request Accepted!",
        description: "You have successfully accepted this premium trade request",
      });
      
      // Navigate to premium payment status
      navigate('/premium-payment-status', {
        state: {
          tradeId: tradeRequest.id,
          amount: tradeRequest.amount,
          nairaAmount: tradeRequest.nairaAmount,
          cryptocurrency: tradeRequest.coin,
          trader: tradeRequest.userName,
          type: tradeRequest.type,
          isPremium: true
        }
      });
    }, 2000);
  };

  const handleDeclineTrade = () => {
    toast({
      title: "Trade Request Declined",
      description: "You have declined this trade request",
    });
    navigate('/premium-trade-requests');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Bank Transfer':
        return '🏦';
      case 'Cash Delivery':
        return '🚚';
      case 'Cash Pickup':
        return '📍';
      default:
        return '💳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-trade-requests" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Trade Request Details</h1>
              <p className="text-gray-600 text-sm">Review and accept premium trade</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trade Overview */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{tradeRequest.direction}</h2>
              <p className="text-gray-700">{tradeRequest.coin} Trade Request</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{tradeRequest.amount} {tradeRequest.coin}</div>
              <div className="text-lg text-gray-700">{tradeRequest.nairaAmount}</div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Rate:</span>
                <div className="font-bold">{tradeRequest.rate}</div>
              </div>
              <div>
                <span className="text-gray-600">Time Left:</span>
                <div className="font-bold text-red-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {tradeRequest.timeLeft}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Trader Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Trader Information</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {tradeRequest.userName.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{tradeRequest.userName}</h4>
                <Crown size={16} className="text-yellow-500" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star size={14} className="text-yellow-500 mr-1" />
                  <span className="font-medium">{tradeRequest.rating}</span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">{tradeRequest.tradeHistory} trades</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600 font-medium">{tradeRequest.completionRate}% Success</div>
              <div className="text-xs text-gray-500">Avg: {tradeRequest.averageTime}</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">{tradeRequest.verificationLevel}</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              This trader has completed premium verification and has an excellent track record
            </p>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Available Payment Methods</h3>
          <div className="space-y-3">
            {tradeRequest.paymentMethods.map((method: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getPaymentMethodIcon(method)}</span>
                  <span className="font-medium text-gray-900">{method}</span>
                  {method.includes('Cash') && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
                <CheckCircle size={16} className="text-green-500" />
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Assessment */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Risk Assessment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Trader Verification:</span>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">Verified</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment Security:</span>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">Secure</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Trade Amount:</span>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">Within Limits</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overall Risk:</span>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">Low Risk</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleAcceptTrade}
            disabled={isAccepting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            {isAccepting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Accepting Trade...
              </div>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Accept Trade Request
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDeclineTrade}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50 py-3"
          >
            Decline Request
          </Button>
          
          <Button
            onClick={() => navigate('/premium-messages')}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            Message Trader First
          </Button>
        </div>

        {/* Warning */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Important Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                By accepting this trade, you agree to complete the transaction within the specified timeframe. 
                Premium trades have enhanced protection and priority support.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTradeRequestDetails;
