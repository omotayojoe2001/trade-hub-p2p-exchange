import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Clock, CreditCard, Shield } from "lucide-react";

const SellCryptoWaiting = () => {
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
  const [paymentReceived, setPaymentReceived] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = location.state || {};

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    // Simulate payment received after 45 seconds
    const timer = setTimeout(() => {
      setPaymentReceived(true);
    }, 45000);

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmReceipt = () => {
    navigate("/sell-crypto-confirm-receipt", { state: { amount, nairaAmount } });
  };

  const handleRaiseDispute = () => {
    navigate("/sell-crypto-dispute");
  };

  const handleContactBuyer = () => {
    console.log("Contacting buyer...");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Waiting for Payment</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className={`border-blue-200 ${paymentReceived ? 'bg-green-50' : 'bg-blue-50'}`}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              {paymentReceived ? (
                <CreditCard className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
              )}
              <span className={`font-semibold ${paymentReceived ? 'text-green-800' : 'text-blue-800'}`}>
                {paymentReceived ? 'Payment Received!' : `Payment due: ${formatTime(countdown)}`}
              </span>
            </div>
            <p className={`text-sm ${paymentReceived ? 'text-green-700' : 'text-blue-700'}`}>
              {paymentReceived ? 'Check your bank account and confirm receipt' : 'Buyer will send payment to your bank account'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Buyer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">Alice Smith</div>
                <div className="text-sm text-muted-foreground">
                  {paymentReceived ? 'Payment sent' : 'Preparing payment...'}
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                paymentReceived ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {paymentReceived ? (
                  <CreditCard className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount to Receive</span>
                <span className="font-semibold">₦{nairaAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto to Release</span>
                <span className="font-semibold">{amount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={paymentReceived ? 'text-green-600' : 'text-orange-600'}>
                  {paymentReceived ? 'Payment Received' : 'Awaiting Payment'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Your crypto is safe:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Crypto is held in escrow until payment is confirmed</li>
                  <li>• Only release after confirming payment in your account</li>
                  <li>• Our system monitors all transactions</li>
                  <li>• Contact support if you need help</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {paymentReceived ? (
          <div className="space-y-3">
            <Button onClick={handleConfirmReceipt} className="w-full h-12">
              Confirm Payment Received
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleContactBuyer}>
                Contact Buyer
              </Button>
              <Button variant="outline" onClick={handleRaiseDispute}>
                Raise Dispute
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button variant="outline" onClick={handleContactBuyer} className="w-full">
              Contact Buyer
            </Button>
            <Button variant="outline" onClick={handleRaiseDispute} className="w-full">
              Raise Dispute
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellCryptoWaiting;