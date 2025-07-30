import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface BiometricSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const BiometricSetup: React.FC<BiometricSetupProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [credentialName, setCredentialName] = useState('Primary Device');
  const { 
    isSupported, 
    isEnrolled, 
    loading, 
    registerBiometric,
    authenticateWithBiometric 
  } = useBiometricAuth();

  const handleSetupBiometric = async () => {
    const success = await registerBiometric(credentialName);
    if (success) {
      setStep(2);
    }
  };

  const handleTestBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      setStep(3);
      onComplete?.();
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Biometric Not Supported</CardTitle>
          <p className="text-muted-foreground">
            Your device doesn't support biometric authentication
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={onSkip} className="w-full" variant="outline">
            Continue Without Biometric
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEnrolled && step === 1) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Biometric Already Set Up</CardTitle>
          <p className="text-muted-foreground">
            Biometric authentication is already configured for your account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestBiometric} className="w-full" disabled={loading}>
            Test Biometric Authentication
          </Button>
          <Button onClick={onComplete} variant="outline" className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {step === 3 ? (
            <CheckCircle className="w-8 h-8 text-primary" />
          ) : (
            <Fingerprint className="w-8 h-8 text-primary" />
          )}
        </div>
        <CardTitle>
          {step === 1 && "Set Up Biometric Authentication"}
          {step === 2 && "Test Your Setup"}
          {step === 3 && "Setup Complete!"}
        </CardTitle>
        <p className="text-muted-foreground">
          {step === 1 && "Secure your account with fingerprint or face recognition"}
          {step === 2 && "Let's make sure everything is working correctly"}
          {step === 3 && "Biometric authentication is now active"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Name</label>
              <Input
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                placeholder="e.g., iPhone 15 Pro, Samsung Galaxy"
              />
              <p className="text-xs text-muted-foreground">
                Give this device a name to identify it in your security settings
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Security Benefits</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Faster login without passwords</li>
                    <li>• Enhanced account security</li>
                    <li>• Secure transaction verification</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSetupBiometric} 
              className="w-full" 
              disabled={loading || !credentialName.trim()}
            >
              {loading ? "Setting Up..." : "Set Up Biometric"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center space-y-4">
              <div className="text-6xl">🔐</div>
              <p className="text-sm text-muted-foreground">
                Your device will now prompt you to authenticate using your fingerprint or face recognition
              </p>
            </div>
            
            <Button 
              onClick={handleTestBiometric} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Test Biometric Authentication"}
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <p className="text-sm text-muted-foreground">
                Biometric authentication is now active. You can use it to quickly log in and verify transactions.
              </p>
            </div>
            
            <Button onClick={onComplete} className="w-full">
              Get Started
            </Button>
          </>
        )}

        <div className="text-center">
          <Button variant="link" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BiometricSetup;