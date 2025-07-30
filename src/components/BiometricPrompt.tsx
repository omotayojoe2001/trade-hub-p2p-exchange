import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Eye } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface BiometricPromptProps {
  title?: string;
  description?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onFallback?: () => void;
}

const BiometricPrompt: React.FC<BiometricPromptProps> = ({ 
  title = "Authenticate",
  description = "Use your fingerprint or face recognition to continue",
  onSuccess,
  onCancel,
  onFallback
}) => {
  const { authenticateWithBiometric, loading } = useBiometricAuth();

  const handleAuthenticate = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      onSuccess?.();
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="flex space-x-1">
            <Fingerprint className="w-6 h-6 text-primary" />
            <Eye className="w-6 h-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAuthenticate} 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "Authenticating..." : "Use Biometric"}
        </Button>
        
        <div className="flex space-x-2">
          {onFallback && (
            <Button onClick={onFallback} variant="outline" className="flex-1">
              Use Password
            </Button>
          )}
          {onCancel && (
            <Button onClick={onCancel} variant="ghost" className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BiometricPrompt;