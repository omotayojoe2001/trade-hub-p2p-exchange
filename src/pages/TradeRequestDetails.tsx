import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, Shield, ChevronRight, Timer, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const TradeRequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { request } = location.state || {};
  
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

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

  const handleAccept = () => {
    if (isExpired) {
      toast({
        title: "Request Expired",
        description: "This trade request has expired",
        variant: "destructive"
      });
      return;
    }

    // Navigate to merchant trade flow
    navigate('/merchant-trade-flow', { 
      state: { 
        request,
        accepted: true 
      }
    });
    
    toast({
      title: "Trade Accepted",
      description: "You have accepted this trade request",
      variant: "default"
    });
  };

  const handleDecline = () => {
    navigate('/trade-requests');
    toast({
      title: "Trade Declined",
      description: "You have declined this trade request",
      variant: "destructive"
    });
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Trade request not found</p>
      </div>
    );
  }

  // Calculate current rate with slight fluctuation
  const currentRate = request.rate + (Math.random() - 0.5) * 100;
  const currentNairaAmount = parseFloat(request.amount) * currentRate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center">
          <button onClick={() => navigate('/trade-requests')}>
            <ArrowLeft size={24} className="text-foreground mr-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Trade Request Details</h1>
            <p className="text-sm text-muted-foreground">#{request.id}</p>
          </div>
        </div>
      </div>

      {/* Urgency Timer */}
      <div className={`p-4 ${isExpired ? 'bg-destructive/10' : 'bg-orange-50'} border-b`}>
        <div className="flex items-center justify-center">
          <Timer size={20} className={`mr-2 ${isExpired ? 'text-destructive' : 'text-orange-600'}`} />
          <span className={`font-semibold ${isExpired ? 'text-destructive' : 'text-orange-800'}`}>
            {isExpired ? 'Request Expired' : `Expires in: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Trade Direction */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="text-center mb-4">
            <div className={`w-16 h-16 ${request.type === 'buy' ? 'bg-brand/10' : 'bg-success/10'} rounded-full flex items-center justify-center mx-auto mb-3`}>
              <span className={`text-2xl font-bold ${request.type === 'buy' ? 'text-brand' : 'text-success'}`}>
                {request.type === 'buy' ? '💰' : '₿'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {request.type === 'buy' ? 'Crypto to Cash Request' : 'Cash to Crypto Request'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {request.type === 'buy' 
                ? 'User wants to sell crypto and receive cash in their bank account' 
                : 'User wants to buy crypto and will send crypto to your account'
              }
            </p>
          </div>

          {/* Trade Flow Visualization */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <User size={20} className="text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">User</p>
              <p className="text-sm font-medium text-foreground">
                {request.type === 'buy' ? 'Sends Crypto' : 'Sends Crypto'}
              </p>
            </div>
            
            <div className="flex-1 text-center">
              <ChevronRight size={20} className="text-muted-foreground mx-auto" />
            </div>
            
            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <User size={20} className="text-secondary-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">You</p>
              <p className="text-sm font-medium text-foreground">
                {request.type === 'buy' ? 'Send Cash' : 'Send Cash'}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Transaction Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Crypto Amount</span>
              <span className="font-semibold text-foreground">{request.amount} {request.coin}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Your Rate</span>
              <span className="font-semibold text-foreground">₦{request.rate.toLocaleString()}/{request.coin}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Market Rate</span>
              <span className={`font-semibold ${currentRate > request.rate ? 'text-success' : 'text-destructive'}`}>
                ₦{currentRate.toLocaleString()}/{request.coin}
              </span>
            </div>
            
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cash Amount</span>
                <div className="text-right">
                  <span className="font-bold text-lg text-foreground">₦{request.nairaAmount.toLocaleString()}</span>
                  <p className="text-xs text-muted-foreground">
                    Current: ₦{currentNairaAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold text-foreground">{request.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Price Fluctuation Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-orange-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800 mb-1">Price Fluctuation Notice</h4>
              <p className="text-sm text-orange-700">
                The cash amount may fluctuate due to real-time crypto price changes. The rate shown is what the user agreed to.
              </p>
            </div>
          </div>
        </div>

        {/* Merchant Info */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Information</h3>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mr-4">
              <User size={20} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{request.merchantName}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <Shield size={12} className="mr-1" />
                <span>{request.merchantRating}/5 rating</span>
                <span className="mx-2">•</span>
                <Clock size={12} className="mr-1" />
                <span>Posted {request.timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1"
            disabled={isExpired}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className={`flex-1 ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isExpired}
          >
            {isExpired ? 'Expired' : 'Accept Trade'}
          </Button>
        </div>

        {/* Important Notes */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Important Notes:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• {request.type === 'buy' ? 'User has already sent crypto to escrow' : 'User will send crypto to escrow'}</li>
            <li>• {request.type === 'buy' ? 'You will send cash to their bank account' : 'You will send cash to their account'}</li>
            <li>• All transactions are secured by our escrow system</li>
            <li>• You have 60 seconds to accept this request</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TradeRequestDetails;