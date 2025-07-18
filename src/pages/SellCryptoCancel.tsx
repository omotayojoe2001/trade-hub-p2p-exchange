import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const SellCryptoCancel = () => {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const navigate = useNavigate();

  const cancelReasons = [
    "Changed my mind",
    "Found a better rate elsewhere",
    "Buyer not responding",
    "Payment issues",
    "Technical difficulties",
    "Other"
  ];

  const handleConfirmCancel = () => {
    const finalReason = reason === "Other" ? customReason : reason;
    console.log("Sell trade cancelled:", finalReason);
    navigate("/home");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Cancel Trade</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1 text-orange-800">
                  Are you sure you want to cancel?
                </p>
                <p className="text-orange-700">
                  Cancelling trades frequently may affect your seller rating and future trade opportunities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Reason for Cancellation</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={reason} onValueChange={setReason}>
              {cancelReasons.map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <RadioGroupItem value={item} id={item} />
                  <Label htmlFor={item} className="text-sm">
                    {item}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {reason === "Other" && (
              <div className="mt-4">
                <Label htmlFor="custom-reason" className="text-sm font-medium">
                  Please specify
                </Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Tell us why you're cancelling..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium mb-2">Before you cancel:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Check if the buyer has already made payment</li>
                <li>• Try contacting the buyer first</li>
                <li>• Consider giving the buyer more time</li>
                <li>• Remember that cancelling affects your seller rating</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={handleConfirmCancel} 
            variant="destructive" 
            className="w-full h-12"
            disabled={!reason || (reason === "Other" && !customReason)}
          >
            Confirm Cancellation
          </Button>
          <Button onClick={handleGoBack} variant="outline" className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellCryptoCancel;