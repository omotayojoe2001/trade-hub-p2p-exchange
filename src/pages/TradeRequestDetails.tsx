import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, Shield, ChevronRight, Timer, AlertTriangle, CheckCircle, ArrowUpDown, Banknote, Coins } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useLocation } from 'react-router-dom';
import CryptoIcon from '@/components/CryptoIcon';
import { useToast } from '@/hooks/use-toast';
import { tradeRequestService } from '@/services/tradeRequestService';
import { useAuth } from '@/hooks/useAuth';

const TradeRequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { request } = location.state || {};

  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleAccept = async () => {
    if (isExpired) {
      toast({
        title: "Request Expired",
        description: "This trade request has expired",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept trade requests",
        variant: "destructive"
      });
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Accept the trade request using the service
      const trade = await tradeRequestService.acceptTradeRequest(request.id, user.id);

      toast({
        title: "Trade Accepted!",
        description: "You have successfully accepted this trade request. The customer has been notified.",
        variant: "default"
      });

      // Navigate to merchant trade flow with the created trade
      navigate('/merchant-trade-flow', {
        state: {
          request,
          trade,
          accepted: true
        }
      });

    } catch (error) {
      console.error('Error accepting trade:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept trade request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to decline trade requests",
        variant: "destructive"
      });
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Decline the trade request as a merchant
      await tradeRequestService.declineTradeRequest(request.id, user.id);

      toast({
        title: "Trade Declined",
        description: "You have declined this trade request. The customer has been notified.",
        variant: "destructive"
      });

      navigate('/trade-requests');

    } catch (error) {
      console.error('Error declining trade:', error);
      toast({
        title: "Error",
        description: "Failed to decline trade request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Trade request not found</p>
      </div>
    );
  }

  // Determine trade direction and what each party gets/sends
  const isUserBuyingCrypto = request.type === 'buy'; // User wants crypto, merchant sends crypto
  const userGets = isUserBuyingCrypto ? `${request.amount} ${request.coin}` : `₦${request.nairaAmount}`;
  const userSends = isUserBuyingCrypto ? `₦${request.nairaAmount}` : `${request.amount} ${request.coin}`;
  const merchantGets = isUserBuyingCrypto ? `₦${request.nairaAmount}` : `${request.amount} ${request.coin}`;
  const merchantSends = isUserBuyingCrypto ? `${request.amount} ${request.coin}` : `₦${request.nairaAmount}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <button onClick={() => navigate('/trade-requests')} className="mr-4">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Trade Request</h1>
            <p className="text-sm text-gray-500">#{request.id}</p>
          </div>
        </div>
      </div>

      {/* Urgency Timer */}
      <div className={`p-4 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border-b`}>
        <div className="flex items-center justify-center">
          <Timer size={20} className={`mr-2 ${isExpired ? 'text-red-600' : 'text-orange-600'}`} />
          <span className={`font-semibold ${isExpired ? 'text-red-800' : 'text-orange-800'}`}>
            {isExpired ? 'Request Expired' : `Expires in: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Trade Overview */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowUpDown size={24} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isUserBuyingCrypto ? 'User Wants to Buy Crypto' : 'User Wants to Sell Crypto'}
              </h2>
              <p className="text-gray-600">
                {isUserBuyingCrypto 
                  ? 'User wants to buy crypto from you' 
                  : 'User wants to sell crypto to you'
                }
              </p>
            </div>

            {/* Trade Flow */}
            <div className="space-y-4">
              {/* What User Gets */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle size={20} className="text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-800">User Will Receive</h3>
                </div>
                <div className="flex items-center">
                  {isUserBuyingCrypto ? (
                    <CryptoIcon symbol={request.coin} size={24} className="mr-2" />
                  ) : (
                    <Banknote size={24} className="text-green-600 mr-2" />
                  )}
                  <span className="text-lg font-bold text-green-800">{userGets}</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {isUserBuyingCrypto 
                    ? 'Crypto will be sent to user\'s wallet' 
                    : 'Cash will be sent to user\'s bank account'
                  }
                </p>
              </div>

              {/* What User Sends */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ArrowUpDown size={20} className="text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800">User Will Send</h3>
                </div>
                <div className="flex items-center">
                  {isUserBuyingCrypto ? (
                    <Banknote size={24} className="text-blue-600 mr-2" />
                  ) : (
                    <CryptoIcon symbol={request.coin} size={24} className="mr-2" />
                  )}
                  <span className="text-lg font-bold text-blue-800">{userSends}</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {isUserBuyingCrypto 
                    ? 'Cash will be sent to your bank account' 
                    : 'Crypto will be sent to your wallet'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escrow Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Escrow Protection</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>• {isUserBuyingCrypto ? 'User will send cash to your bank account' : 'User will send crypto to your wallet'}</p>
                  <p>• {isUserBuyingCrypto ? 'You will send crypto to user\'s wallet' : 'You will send cash to user\'s bank account'}</p>
                  <p>• All transactions are secured by our escrow system</p>
                  <p>• Funds are released only after both parties confirm</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Details */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Trade Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">{request.amount} {request.coin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rate</span>
                <span className="font-semibold text-gray-900">{request.rate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value</span>
                <span className="font-semibold text-gray-900">₦{request.nairaAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User</span>
                <span className="font-semibold text-gray-900">{request.userName || 'Anonymous'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1 h-12"
            disabled={isExpired || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Decline'}
          </Button>
          <Button
            onClick={handleAccept}
            className={`flex-1 h-12 ${isExpired || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isExpired || isProcessing}
          >
            {isProcessing ? 'Accepting...' : isExpired ? 'Expired' : 'Accept Trade'}
          </Button>
        </div>

        {/* Important Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertTriangle size={20} className="text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Important</h4>
                <div className="space-y-1 text-sm text-yellow-700">
                  <p>• You have 60 seconds to accept this request</p>
                  <p>• Once accepted, you'll need to complete the payment within 30 minutes</p>
                  <p>• Make sure you have the required funds available</p>
                  <p>• Upload payment proof after completing the transaction</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradeRequestDetails;