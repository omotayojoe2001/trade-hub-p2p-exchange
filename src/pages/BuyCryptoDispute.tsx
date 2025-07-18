import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertTriangle, Upload } from "lucide-react";

const BuyCryptoDispute = () => {
  const [disputeType, setDisputeType] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<File[]>([]);
  const navigate = useNavigate();

  const disputeTypes = [
    "Merchant didn't release crypto after payment",
    "Merchant is not responding",
    "Wrong amount received",
    "Paid but merchant claims no payment",
    "Merchant cancelled after payment",
    "Other issue"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidence(prev => [...prev, ...files]);
  };

  const handleSubmitDispute = () => {
    const disputeData = {
      type: disputeType,
      description,
      evidence: evidence.map(file => file.name),
      timestamp: new Date().toISOString()
    };
    
    console.log("Dispute submitted:", disputeData);
    navigate("/help-support");
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
        <h1 className="text-lg font-semibold">Raise Dispute</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1 text-red-800">
                  Dispute Resolution
                </p>
                <p className="text-red-700">
                  Our team will review your case and help resolve the issue within 24 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">What happened?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={disputeType} onValueChange={setDisputeType}>
              {disputeTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Describe the Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Please provide as much detail as possible about what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evidence (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload screenshots, receipts, or other evidence
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </div>
              
              {evidence.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded files:</p>
                  {evidence.map((file, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Our support team will review your dispute</li>
                <li>• We'll contact the merchant for their response</li>
                <li>• You'll receive updates via notifications</li>
                <li>• Most disputes are resolved within 24 hours</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={handleSubmitDispute} 
            className="w-full h-12"
            disabled={!disputeType || !description}
          >
            Submit Dispute
          </Button>
          <Button onClick={handleGoBack} variant="outline" className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoDispute;