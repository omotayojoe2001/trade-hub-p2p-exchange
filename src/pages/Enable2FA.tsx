import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Copy, ArrowLeft } from "lucide-react";

const Enable2FA = () => {
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const secretKey = "JBSWY3DPEHPK3PXP";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/CryptoTrade:user@example.com?secret=${secretKey}&issuer=CryptoTrade`;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
  };

  const handleVerify = () => {
    // TODO: Implement 2FA verification logic
    console.log("Verifying 2FA code:", code);
    navigate("/security");
  };

  const handleSkip = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/security")}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Enable 2FA</CardTitle>
          <p className="text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="text-center">
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Scan this QR code with your authenticator app
                </p>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <code className="text-xs flex-1">{secretKey}</code>
                  <Button size="sm" variant="outline" onClick={handleCopySecret}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                I've Added the Account
              </Button>
            </>
          )}
          
          {step === 2 && (
            <>
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
                Verify & Enable 2FA
              </Button>
            </>
          )}
          
          <div className="text-center">
            <Button variant="link" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Enable2FA;