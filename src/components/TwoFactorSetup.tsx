import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Smartphone, Copy, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  generateTwoFactorSetup, 
  enableTwoFactor, 
  verifyTOTPCode,
  TwoFactorSetup as TwoFactorSetupData 
} from '@/services/twoFactorAuth';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail: string;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isOpen,
  onClose,
  onComplete,
  userEmail
}) => {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !setupData) {
      generateSetup();
    }
  }, [isOpen]);

  const generateSetup = async () => {
    setIsGenerating(true);
    try {
      const setup = await generateTwoFactorSetup(userEmail);
      setSetupData(setup);
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to generate 2FA setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `Central Exchange - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}
Email: ${userEmail}

IMPORTANT: Save these codes in a secure location. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Instructions:
- Use these codes if you lose access to your authenticator app
- Each code can only be used once
- Generate new codes if you run out
- Keep these codes secure and private`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-exchange-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Backup codes saved to your device",
    });
  };

  const handleVerification = async () => {
    if (!setupData || !verificationCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = verifyTOTPCode(verificationCode, setupData.secret);
      
      if (isValid) {
        // Enable 2FA
        enableTwoFactor(setupData.secret, setupData.backupCodes);
        
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled",
        });
        
        setStep(3); // Success step
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = () => {
    setStep(1);
    setSetupData(null);
    setVerificationCode('');
    onComplete();
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    setSetupData(null);
    setVerificationCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Setup Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Install Authenticator App</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download and install Google Authenticator or any compatible TOTP app on your phone.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Recommended Apps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Google Authenticator</li>
                <li>• Microsoft Authenticator</li>
                <li>• Authy</li>
                <li>• 1Password</li>
              </ul>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "I have an authenticator app"}
            </Button>
          </div>
        )}

        {step === 2 && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app
              </p>
            </div>

            <div className="flex justify-center">
              <img 
                src={setupData.qrCodeUrl} 
                alt="2FA QR Code" 
                className="w-48 h-48 border rounded-lg"
              />
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Manual Entry Key:</h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-white p-2 rounded border font-mono">
                  {setupData.manualEntryKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupData.manualEntryKey, 'Manual entry key')}
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enter verification code:</label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-wider"
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleVerification} 
                disabled={verificationCode.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">2FA Enabled Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Save Your Backup Codes</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Download and securely store these backup codes. You'll need them if you lose access to your authenticator app.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                    className="text-yellow-800 border-yellow-300"
                  >
                    <Download size={14} className="mr-2" />
                    Download Backup Codes
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorSetup;
