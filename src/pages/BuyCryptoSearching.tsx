import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";

const BuyCryptoSearching = () => {
  const [stage, setStage] = useState('searching'); // searching -> found -> accepted -> escrow
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount, selectedMerchant, coinType } = location.state || {};

  useEffect(() => {
    // Simulate merchant finding process
    const timer1 = setTimeout(() => {
      setStage('found');
    }, 3000);

    // Simulate merchant acceptance
    const timer2 = setTimeout(() => {
      setStage('accepted');
    }, 6000);

    // Simulate escrow funding
    const timer3 = setTimeout(() => {
      setStage('escrow');
    }, 9000);

    // Navigate to payment after escrow is ready
    const timer4 = setTimeout(() => {
      navigate("/buy-crypto-payment", { 
        state: { 
          amount, 
          nairaAmount, 
          selectedMerchant,
          coinType,
          step: 'payment'
        } 
      });
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate, amount, nairaAmount, selectedMerchant, coinType]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageText = () => {
    switch (stage) {
      case 'searching':
        return {
          title: "Searching for Merchant",
          description: "Finding the best available merchant for your trade...",
          icon: <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        };
      case 'found':
        return {
          title: "Merchant Found!",
          description: `Matched with ${selectedMerchant?.display_name || 'merchant'}. Waiting for acceptance...`,
          icon: <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        };
      case 'accepted':
        return {
          title: "Trade Accepted!",
          description: "Merchant has accepted your trade. Setting up escrow...",
          icon: <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        };
      case 'escrow':
        return {
          title: "Escrow Ready",
          description: "Merchant has funded escrow with your crypto. You can now make payment.",
          icon: <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        };
      default:
        return {
          title: "Processing...",
          description: "Please wait...",
          icon: <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        };
    }
  };

  const stageInfo = getStageText();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Buy Crypto</h1>
        <div className="w-10" />
      </div>

      {/* Timer */}
      <div className="p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center justify-center">
          <Clock className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800 font-semibold">
            Time Remaining: {formatTime(countdown)}
          </span>
        </div>
        <p className="text-sm text-green-700 text-center mt-1">
          Complete your payment within the time limit
        </p>
      </div>

      <div className="p-4 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {stageInfo.icon}
            <h2 className="text-xl font-semibold mb-2">{stageInfo.title}</h2>
            <p className="text-muted-foreground mb-4">
              {stageInfo.description}
            </p>
            
            {stage === 'escrow' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  ✓ Merchant has deposited {amount} {coinType} into escrow
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Your crypto is secured and will be released after payment confirmation
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Summary */}
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Trade Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You'll Send</span>
                <span className="font-semibold">₦{nairaAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You'll Receive</span>
                <span className="font-semibold">{amount} {coinType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-semibold">{selectedMerchant?.display_name || 'Finding...'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyCryptoSearching;