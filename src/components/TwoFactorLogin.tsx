import React, { useState } from 'react';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorLoginProps {
  onSuccess: () => void;
  onBack: () => void;
  userEmail: string;
  pendingUser?: any;
}

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({ onSuccess, onBack, userEmail, pendingUser }) => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerifyCode = async () => {
    if (code.length < 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      if (pendingUser) {
        const { twoFactorAuthService } = await import('@/services/twoFactorAuthService');
        const isValid = await twoFactorAuthService.verify2FAToken(pendingUser.id, code);
        
        if (isValid) {
          toast({
            title: "Verification Successful",
            description: "2FA verification completed.",
          });
          onSuccess();
        } else {
          toast({
            title: "Invalid Code",
            description: "The verification code you entered is incorrect. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
      setCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white border-gray-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
          <p className="text-gray-600 mt-2">
            Enter the verification code from your authenticator app
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Signed in as: {userEmail}
          </p>
        </div>

        {/* Verification Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder={useBackupCode ? "Enter backup code" : "000000"}
              maxLength={useBackupCode ? 8 : 6}
              className="text-center text-lg font-mono tracking-wider"
              disabled={isVerifying}
            />
            <p className="text-xs text-gray-500 mt-1">
              {useBackupCode 
                ? 'Enter one of your 8-character backup codes'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </p>
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={isVerifying || code.length < (useBackupCode ? 8 : 6)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </Button>

          {/* Alternative Options */}
          <div className="space-y-3">
            <button
              onClick={() => setUseBackupCode(!useBackupCode)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {useBackupCode 
                ? 'Use authenticator app instead'
                : 'Use backup code instead'
              }
            </button>

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-700"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to login
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Security Notice</p>
              <p className="text-xs text-amber-700 mt-1">
                Never share your verification codes with anyone. TradeHub will never ask for your 2FA codes.
              </p>
            </div>
          </div>
        </div>


      </Card>
    </div>
  );
};

export default TwoFactorLogin;
