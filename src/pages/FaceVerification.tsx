import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import YouverifyPassiveLiveness from "youverify-passive-liveness-web";

const FaceVerification = () => {
  const [loading, setLoading] = useState(false);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [identityData, setIdentityData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user came here from identity verification
    const storedData = sessionStorage.getItem('identity-verification-data');
    if (!storedData) {
      toast({
        title: "Missing Information",
        description: "Please complete identity verification first.",
        variant: "destructive"
      });
      navigate('/identity-verification');
      return;
    }
    
    setIdentityData(JSON.parse(storedData));
  }, [navigate, toast]);

  const startFaceVerification = async () => {
    if (!identityData) return;

    setLoading(true);
    setVerificationStarted(true);

    try {
      const yvPassiveLiveness = new YouverifyPassiveLiveness({
        tasks: [{ id: "passive" }],
        publicKey: "68b5bb503d58cd9b51d9fb2c", // Your public merchant key
        sandboxEnvironment: true, // Set to false for production
        presentation: "modal",
        user: {
          firstName: identityData.firstName,
          lastName: identityData.lastName,
          email: "user@example.com" // You might want to get this from user context
        },
        branding: {
          color: "#3B82F6", // Your brand color
          logo: "/logo.png" // Your logo URL
        },
        allowAudio: true,
        onSuccess: (data) => {
          console.log("Face verification successful:", data);
          
          // Store verification results
          const verificationResult = {
            ...identityData,
            faceVerification: {
              passed: data.passed,
              faceImage: data.faceImage,
              livenessClip: data.livenessClip,
              verifiedAt: new Date().toISOString()
            }
          };
          
          sessionStorage.setItem('verification-complete', JSON.stringify(verificationResult));
          
          toast({
            title: "Verification Successful!",
            description: "Your identity has been verified successfully.",
          });

          // Navigate to success page
          navigate('/verification-success');
        },
        onFailure: (data) => {
          console.log("Face verification failed:", data);
          setLoading(false);
          setVerificationStarted(false);
          
          toast({
            title: "Verification Failed",
            description: "Face verification was not successful. Please try again.",
            variant: "destructive"
          });
        },
        onClose: () => {
          console.log("Face verification modal closed");
          setLoading(false);
          setVerificationStarted(false);
        }
      });

      // Start the verification process
      yvPassiveLiveness.start();
      
    } catch (error) {
      console.error("Face verification error:", error);
      setLoading(false);
      setVerificationStarted(false);
      
      toast({
        title: "Verification Error",
        description: "Failed to start face verification. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    setLoading(false);
    setVerificationStarted(false);
  };

  if (!identityData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/identity-verification")}
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-4">Face Verification</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Complete Your Verification</CardTitle>
            <p className="text-muted-foreground">
              Take a quick selfie to complete your identity verification
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Information Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Verifying Identity For:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {identityData.firstName} {identityData.lastName}</p>
                <p><strong>BVN:</strong> ***-***-{identityData.bvn.slice(-4)}</p>
                <p><strong>Phone:</strong> {identityData.phoneNumber}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Camera size={20} className="text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Face Verification Instructions</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Ensure good lighting on your face</li>
                    <li>• Look directly at the camera</li>
                    <li>• Remove glasses or face coverings</li>
                    <li>• Stay still during the verification</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield size={20} className="text-green-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Secure & Private</h4>
                  <p className="text-green-700 text-sm">
                    Your biometric data is processed securely and used only for verification purposes. 
                    We comply with all privacy regulations.
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            {verificationStarted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Loader2 size={20} className="text-yellow-600 mr-3 animate-spin" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Verification in Progress</h4>
                    <p className="text-yellow-700 text-sm">Please follow the instructions in the verification window.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={startFaceVerification} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Face Verification
                  </>
                )}
              </Button>

              {verificationStarted && (
                <Button 
                  variant="outline"
                  onClick={handleRetry} 
                  className="w-full"
                >
                  Cancel & Retry
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Having trouble? Make sure your camera is enabled and you have good lighting.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FaceVerification;
