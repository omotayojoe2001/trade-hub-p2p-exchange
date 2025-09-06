import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Star } from "lucide-react";

const BuyCryptoMatch = () => {
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
  const [isMatched, setIsMatched] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMatched(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMatched && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isMatched, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    navigate("/payment-status", { state: { amount, nairaAmount, mode: 'buy', step: 1 } });
  };

  const handleCancel = () => {
    navigate("/buy-crypto-cancel");
  };

  if (!isMatched) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Finding Merchant</h1>
          <div className="w-10" />
        </div>

        <div className="p-4 flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold mb-2">Searching for Merchant</h2>
              <p className="text-muted-foreground">
                We're finding the best merchant for your trade...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Merchant Matched</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-semibold">
                Time Remaining: {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-green-700">
              Complete your payment within the time limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              No merchants available at this time. Please try again later.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Trade Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You Pay</span>
                <span className="font-semibold">₦{nairaAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You Get</span>
                <span className="font-semibold">{amount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>₦75,432,000/BTC</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel Trade
          </Button>
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoMatch;