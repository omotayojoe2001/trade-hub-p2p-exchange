import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, CheckCircle, AlertCircle, FileCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BVNVerification = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bvnData, setBvnData] = useState({
    bvn: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setBvnData(prev => ({ ...prev, [field]: value }));
  };

  const handleVerifyBVN = async () => {
    if (!bvnData.bvn || bvnData.bvn.length !== 11) {
      toast({
        title: "Invalid BVN",
        description: "Please enter a valid 11-digit BVN",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate BVN verification API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implement actual BVN verification with NIBSS or other provider
      setStep(2);
      
      toast({
        title: "BVN Verified",
        description: "Your Bank Verification Number has been successfully verified",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to verify BVN. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-4">BVN Verification</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 1 && <FileCheck className="w-8 h-8 text-primary" />}
              {step === 2 && <CheckCircle className="w-8 h-8 text-green-600" />}
            </div>
            <CardTitle>
              {step === 1 && "Verify Your Identity"}
              {step === 2 && "Verification Complete"}
            </CardTitle>
            <p className="text-muted-foreground">
              {step === 1 && "Enter your BVN to verify your identity and comply with financial regulations"}
              {step === 2 && "Your BVN has been successfully verified"}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Why we need your BVN</h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Regulatory compliance with CBN guidelines</li>
                        <li>• Enhanced account security</li>
                        <li>• Fraud prevention and risk management</li>
                        <li>• Required for higher transaction limits</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                    <Input
                      id="bvn"
                      type="tel"
                      placeholder="Enter your 11-digit BVN"
                      value={bvnData.bvn}
                      onChange={(e) => handleInputChange("bvn", e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                      className="text-center text-lg tracking-wider"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dial *565*0# on any phone to get your BVN
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={bvnData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={bvnData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={bvnData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="080xxxxxxxx"
                      value={bvnData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle size={20} className="text-amber-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Privacy Notice</h4>
                      <p className="text-amber-700 text-sm">
                        Your BVN and personal information are encrypted and stored securely. 
                        We comply with all data protection regulations.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyBVN} 
                  className="w-full" 
                  disabled={loading || !bvnData.bvn || bvnData.bvn.length !== 11}
                >
                  {loading ? "Verifying..." : "Verify BVN"}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center space-y-4">
                  <div className="text-6xl">✅</div>
                  <div>
                    <h3 className="font-semibold text-lg">Identity Verified!</h3>
                    <p className="text-muted-foreground">
                      Your BVN has been successfully verified. You now have access to:
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <ul className="text-green-700 text-sm space-y-2">
                      <li className="flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Higher transaction limits
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Enhanced account security
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Access to premium features
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Regulatory compliance
                      </li>
                    </ul>
                  </div>
                </div>

                <Button onClick={handleComplete} className="w-full">
                  Continue to Settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BVNVerification;