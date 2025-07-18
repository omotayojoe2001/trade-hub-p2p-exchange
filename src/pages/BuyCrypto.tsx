import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";

const BuyCrypto = () => {
  const [amount, setAmount] = useState("");
  const [nairaAmount, setNairaAmount] = useState("");
  const navigate = useNavigate();

  const currentRate = 75432000; // BTC to NGN rate

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const naira = parseFloat(value) * currentRate;
    setNairaAmount(naira.toLocaleString());
  };

  const handleNairaChange = (value: string) => {
    setNairaAmount(value);
    const btc = parseFloat(value.replace(/,/g, '')) / currentRate;
    setAmount(btc.toFixed(8));
  };

  const handleContinue = () => {
    // Navigate to match screen with the entered amount
    navigate("/buy-crypto-match", { state: { amount, nairaAmount } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Buy Crypto</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">You Pay (NGN)</label>
              <Input
                type="text"
                placeholder="0.00"
                value={nairaAmount}
                onChange={(e) => handleNairaChange(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Rate: ₦{currentRate.toLocaleString()} per BTC
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">You Get (BTC)</label>
              <Input
                type="text"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• We'll match you with a verified merchant</li>
                  <li>• You'll have 15 minutes to complete payment</li>
                  <li>• Crypto will be released after confirmation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleContinue} 
          className="w-full h-12"
          disabled={!amount || !nairaAmount}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BuyCrypto;