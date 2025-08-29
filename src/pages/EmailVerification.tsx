import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailVerification = () => {
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user came here directly without signing up
    const email = sessionStorage.getItem('verification-email');
    if (!email) {
      navigate('/auth');
    }
  }, [navigate]);

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
        navigate('/auth');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/profile-setup`
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
          title: "Link sent!",
          description: "A new verification link has been sent to your email.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend link. Please try again.",
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
          <CardTitle>Check Your Email</CardTitle>
          <p className="text-muted-foreground">
            We've sent a verification link to your email address
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Verification Link Sent!</h3>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to verify your account and complete the signup process.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
                              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <strong>Next steps:</strong>
              <br />
              1. Check your email inbox (and spam folder)
              <br />
              2. Click the verification link
              <br />
              3. You'll be redirected back to complete your profile
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Didn't receive the email?
            </p>
            <Button 
              onClick={handleResend} 
              variant="outline"
              className="w-full"
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend Verification Link"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;