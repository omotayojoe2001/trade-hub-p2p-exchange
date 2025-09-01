import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, TrendingUp, Users, Zap, Home, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VerificationSuccess = () => {
  const [verificationData, setVerificationData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user completed verification
    const storedData = sessionStorage.getItem('verification-complete');
    if (!storedData) {
      toast({
        title: "No Verification Found",
        description: "Please complete the verification process first.",
        variant: "destructive"
      });
      navigate('/identity-verification');
      return;
    }
    
    const data = JSON.parse(storedData);
    setVerificationData(data);

    // Clear the session storage as verification is complete
    sessionStorage.removeItem('identity-verification-data');
    sessionStorage.removeItem('verification-complete');

    // Show success toast
    toast({
      title: "Identity Verified Successfully!",
      description: "Your account has been upgraded with enhanced features.",
    });
  }, [navigate, toast]);

  const handleContinueToHome = () => {
    navigate('/');
  };

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  if (!verificationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Verification Complete!</CardTitle>
            <p className="text-muted-foreground">
              Your identity has been successfully verified
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Verification Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3">Verification Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Name:</span>
                  <span className="font-medium text-green-800">
                    {verificationData.firstName} {verificationData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">BVN Verified:</span>
                  <span className="font-medium text-green-800">✓ Confirmed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Face Verification:</span>
                  <span className="font-medium text-green-800">
                    ✓ {verificationData.faceVerification?.passed ? 'Passed' : 'Completed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Verified At:</span>
                  <span className="font-medium text-green-800">
                    {new Date(verificationData.faceVerification?.verifiedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Benefits Unlocked */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Benefits Unlocked</h4>
              
              <div className="grid gap-3">
                <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-800">Higher Transaction Limits</h5>
                    <p className="text-sm text-blue-700">
                      Increased daily and monthly trading limits up to ₦10,000,000
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-purple-800">Enhanced Security</h5>
                    <p className="text-sm text-purple-700">
                      Advanced fraud protection and secure trading environment
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Users className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-orange-800">Premium Merchant Access</h5>
                    <p className="text-sm text-orange-700">
                      Access to verified premium merchants with better rates
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-800">Priority Support</h5>
                    <p className="text-sm text-green-700">
                      24/7 priority customer support and faster dispute resolution
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield size={20} className="text-gray-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Regulatory Compliance</h4>
                  <p className="text-gray-700 text-sm">
                    Your verification meets all CBN (Central Bank of Nigeria) requirements for 
                    cryptocurrency trading and financial services.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleContinueToHome} 
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Continue to Trading
              </Button>

              <Button 
                variant="outline"
                onClick={handleGoToSettings} 
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Go to Settings
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Your verification status is now active. You can view your verification details
                in Settings → Identity Verification at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationSuccess;
