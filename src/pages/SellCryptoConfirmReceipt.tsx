import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";

const SellCryptoConfirmReceipt = () => {
  const [amountReceived, setAmountReceived] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = location.state || {};

  const handleConfirmAndRelease = () => {
    const confirmationData = {
      amountReceived,
      reference,
      notes,
      confirmedAt: new Date().toISOString()
    };
    
    console.log("Confirming receipt and releasing crypto:", confirmationData);
    navigate("/trade-completed", { state: { amount, nairaAmount, type: 'sell' } });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRaiseDispute = () => {
    navigate("/sell-crypto-dispute");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Confirm Payment</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-semibold">
                Payment Detected
              </span>
            </div>
            <p className="text-sm text-green-700">
              Check your bank account and confirm the payment details
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payment Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount Received (₦)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="Enter amount received"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expected: ₦{nairaAmount}
              </p>
            </div>
            
            <div>
              <Label htmlFor="reference">Transaction Reference</Label>
              <Input
                id="reference"
                type="text"
                placeholder="Enter bank transaction reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Release Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Payment</span>
                <span className="font-semibold">₦{nairaAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto to Release</span>
                <span className="font-semibold">{amount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buyer</span>
                <span className="font-semibold">Alice Smith</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1 text-orange-800">
                  Important Warning
                </p>
                <p className="text-orange-700">
                  Only confirm if you have received the exact amount in your bank account. 
                  Once confirmed, the crypto will be released and cannot be reversed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="confirm-checkbox"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
          />
          <Label htmlFor="confirm-checkbox" className="text-sm">
            I confirm I have received the payment in my bank account
          </Label>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleConfirmAndRelease} 
            className="w-full h-12"
            disabled={!amountReceived || !confirmed}
          >
            Confirm Payment & Release Crypto
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoBack}>
              Go Back
            </Button>
            <Button variant="outline" onClick={handleRaiseDispute}>
              Raise Dispute
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellCryptoConfirmReceipt;