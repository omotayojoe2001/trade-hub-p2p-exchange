import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, Share } from "lucide-react";

const BuyCryptoSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = location.state || {};

  const tradeDetails = {
    transactionId: "TXN-" + Date.now().toString().slice(-8),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
  };

  const handleDownloadReceipt = () => {
    console.log("Downloading receipt...");
  };

  const handleShareReceipt = () => {
    console.log("Sharing receipt...");
  };

  const handleGoHome = () => {
    navigate("/home");
  };

  const handleViewTrades = () => {
    navigate("/my-trades");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Trade Completed!</h1>
          <p className="text-muted-foreground">
            Your Bitcoin has been successfully purchased
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold mb-2">{amount} BTC</div>
              <div className="text-muted-foreground">Successfully purchased</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">₦{nairaAmount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bitcoin Received</span>
                <span className="font-semibold">{amount} BTC</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-semibold text-sm">{tradeDetails.transactionId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-semibold text-sm">
                  {tradeDetails.date} at {tradeDetails.time}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-semibold">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Your Bitcoin is now available in your account</li>
                <li>• You can view this transaction in your trade history</li>
                <li>• Download your receipt for record keeping</li>
                <li>• Rate your experience with this merchant</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Download className="w-4 h-4 mr-2" />
            Receipt
          </Button>
          <Button variant="outline" onClick={handleShareReceipt}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="space-y-3">
          <Button onClick={handleGoHome} className="w-full h-12">
            Go to Dashboard
          </Button>
          <Button onClick={handleViewTrades} variant="outline" className="w-full">
            View My Trades
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoSuccess;