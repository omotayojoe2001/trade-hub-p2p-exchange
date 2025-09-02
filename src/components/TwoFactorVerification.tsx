import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, Key, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateTwoFactorCode, getRemainingBackupCodes } from '@/services/twoFactorAuth';

interface TwoFactorVerificationProps {
  onVerified: () => void;
  onBack: () => void;
  userEmail: string;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  onVerified,
  onBack,
  userEmail
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { toast } = useToast();

  const handleVerification = async () => {
    if (!code.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = validateTwoFactorCode(code);
      
      if (result.isValid) {
        if (result.type === 'backup') {
          const remaining = getRemainingBackupCodes();
          toast({
            title: "Backup Code Used",
            description: `Login successful. You have ${remaining} backup codes remaining.`,
          });
        } else {
          toast({
            title: "Verification Successful",
            description: "You have been logged in successfully.",
          });
        }
        
        onVerified();
      } else {
        toast({
          title: "Invalid Code",
          description: useBackupCode 
            ? "Invalid backup code. Please check and try again."
            : "Invalid verification code. Please check your authenticator app.",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  const remainingBackupCodes = getRemainingBackupCodes();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
          <p className="text-sm text-gray-600">
            Enter the verification code from your authenticator app
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Signing in as: <strong>{userEmail}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              {useBackupCode ? (
                <Key className="w-6 h-6 text-gray-600 mr-2" />
              ) : (
                <Smartphone className="w-6 h-6 text-blue-600 mr-2" />
              )}
              <span className="text-sm font-medium">
                {useBackupCode ? 'Backup Code' : 'Authenticator Code'}
              </span>
            </div>

            <div>
              <Input
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setCode(useBackupCode ? value.slice(0, 8) : value.slice(0, 6));
                }}
                placeholder={useBackupCode ? "12345678" : "000000"}
                maxLength={useBackupCode ? 8 : 6}
                className="text-center text-lg tracking-wider"
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {useBackupCode 
                  ? "Enter your 8-digit backup code"
                  : "Enter the 6-digit code from your authenticator app"
                }
              </p>
            </div>

            <Button 
              onClick={handleVerification}
              disabled={
                isVerifying || 
                (useBackupCode ? code.length !== 8 : code.length !== 6)
              }
              className="w-full"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <button
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {useBackupCode 
                  ? "Use authenticator app instead"
                  : "Use backup code instead"
                }
              </button>
            </div>

            {useBackupCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 text-center">
                  You have {remainingBackupCodes} backup codes remaining.
                  {remainingBackupCodes <= 2 && " Consider generating new ones after login."}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={onBack}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to login
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Having trouble?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure your device's time is correct</li>
              <li>• Try refreshing your authenticator app</li>
              <li>• Use a backup code if you can't access your app</li>
              <li>• Contact support if you're still having issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorVerification;
