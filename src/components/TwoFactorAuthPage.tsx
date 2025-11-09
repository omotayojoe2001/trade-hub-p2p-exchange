import React, { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorAuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
  userEmail: string;
  pendingUser?: any;
}

const TwoFactorAuthPage: React.FC<TwoFactorAuthPageProps> = ({ 
  onSuccess, 
  onBack, 
  userEmail, 
  pendingUser 
}) => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
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
          onSuccess();
        } else {
          toast({
            title: "Invalid Code",
            description: "The verification code is incorrect. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-500 text-sm">
            Enter the 6-digit code from your Google Authenticator app
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {userEmail}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                maxLength={6}
                className="h-14 text-center text-2xl tracking-widest font-mono bg-gray-50 border-0 rounded-xl"
                disabled={isVerifying}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || code.length !== 6}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-semibold"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </Button>

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-700 py-2"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;