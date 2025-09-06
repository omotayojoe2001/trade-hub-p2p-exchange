import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";

const BuyCryptoWaiting = () => {
  const [countdown, setCountdown] = useState(10 * 60); // 10 minutes for confirmation
  const [isConfirmed, setIsConfirmed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = location.state || {};

  useEffect(() => {
    if (countdown > 0 && !isConfirmed) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, isConfirmed]);

  useEffect(() => {
    // Simulate merchant confirmation after 30 seconds
    const timer = setTimeout(() => {
      setIsConfirmed(true);
      setTimeout(() => {
        navigate("/buy-crypto-success", { state: { amount, nairaAmount } });
      }, 2000);
    }, 30000);

    return () => clearTimeout(timer);
  }, [navigate, amount, nairaAmount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoToTrades = () => {
    navigate("/my-trades");
  };

  const handleContactSupport = () => {
    navigate("/help-support");
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Payment Confirmed</h1>
          <div className="w-10" />
        </div>

        <div className="p-4 flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Payment Confirmed!</h2>
              <p className="text-muted-foreground mb-4">
                Your crypto is being processed and will be available shortly
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-primary rounded-full"></div>
              </div>
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
        <h1 className="text-lg font-semibold">Waiting for Confirmation</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-semibold">
                Waiting for confirmation: {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              Merchant is verifying your payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Trade Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              No merchant assigned. Please try again later.
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">₦{nairaAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto Expected</span>
                <span className="font-semibold">{amount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-orange-600">Pending Confirmation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium mb-2">What's happening?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Your payment has been marked as completed</li>
                <li>• Merchant is verifying the bank transfer</li>
                <li>• Crypto will be released once confirmed</li>
                <li>• You'll receive a notification when complete</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={handleGoToTrades} variant="outline" className="w-full">
            Go to My Trades
          </Button>
          <Button onClick={handleContactSupport} variant="outline" className="w-full">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoWaiting;