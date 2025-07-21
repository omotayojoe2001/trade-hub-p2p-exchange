import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailVerification = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: sessionStorage.getItem('verification-email') || '',
        token: code,
        type: 'signup'
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Email verified!",
          description: "Your account has been successfully verified.",
        });
        sessionStorage.removeItem('verification-email');
        navigate("/profile-setup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const email = sessionStorage.getItem('verification-email');
      if (!email) {
        toast({
          title: "Error",
          description: "No email found. Please try signing up again.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Code sent!",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/signup")}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <p className="text-muted-foreground">
            We've sent a verification code to your email address
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code</label>
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={code} 
                onChange={(value) => setCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>
          
          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={code.length !== 6 || loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <Button 
                variant="link" 
                onClick={handleResend} 
                className="p-0"
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend"}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;