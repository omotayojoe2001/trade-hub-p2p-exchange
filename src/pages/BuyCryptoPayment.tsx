import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Copy, AlertCircle } from "lucide-react";

const BuyCryptoPayment = () => {
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
  const [isPaid, setIsPaid] = useState(false);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bankDetails = {
    bankName: "GTBank",
    accountNumber: "0123456789",
    accountName: "John Doe",
    reference: "BTC-" + Date.now().toString().slice(-6)
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(bankDetails.reference);
  };

  const handleMarkAsPaid = () => {
    setIsPaid(true);
    navigate("/buy-crypto-waiting", { state: { amount, nairaAmount } });
  };

  const handleSendReminder = () => {
    console.log("Sending reminder to merchant");
  };

  const handleCancel = () => {
    navigate("/buy-crypto-cancel");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Payment Instructions</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-orange-800 font-semibold">
                Pay within: {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-orange-700">
              Complete your bank transfer before time expires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bank Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank Name</span>
              <span className="font-semibold">{bankDetails.bankName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Number</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{bankDetails.accountNumber}</span>
                <Button size="sm" variant="ghost" onClick={handleCopyAccount}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{bankDetails.accountName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reference</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{bankDetails.reference}</span>
                <Button size="sm" variant="ghost" onClick={handleCopyReference}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Amount to Pay</span>
              <span className="font-bold text-lg">₦{nairaAmount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Important:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Use the exact reference number provided</li>
                  <li>• Transfer the exact amount shown</li>
                  <li>• Click "Mark as Paid" after transfer</li>
                  <li>• Keep your transfer receipt safe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={handleMarkAsPaid} className="w-full h-12">
            Mark as Paid
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleSendReminder}>
              Send Reminder
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel Trade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoPayment;