import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";

const EmailVerification = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleVerify = () => {
    // TODO: Implement email verification logic
    console.log("Verifying code:", code);
    navigate("/");
  };

  const handleResend = () => {
    // TODO: Implement resend verification code
    console.log("Resending verification code");
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
          <div>
            <label className="text-sm font-medium">Verification Code</label>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-wider"
            />
          </div>
          
          <Button onClick={handleVerify} className="w-full" disabled={code.length !== 6}>
            Verify Email
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <Button variant="link" onClick={handleResend} className="p-0">
                Resend
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;