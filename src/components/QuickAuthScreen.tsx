import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Fingerprint, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BiometricPrompt from './BiometricPrompt';

interface QuickAuthScreenProps {
  user: {
    email: string;
    displayName?: string;
  };
  onSuccess: () => void;
  onCancel?: () => void;
}

const QuickAuthScreen: React.FC<QuickAuthScreenProps> = ({
  user,
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  
  const { toast } = useToast();
  const { isSupported: biometricSupported, isEnrolled: biometricEnrolled } = useBiometricAuth();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user && data.session) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-lg border max-w-sm w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-1">Session Timeout</h2>
          <p className="text-sm text-muted-foreground">Session expired after 60 seconds of inactivity. Please authenticate to continue.</p>
        </div>

        {/* User Profile Section */}
        <div className="text-center mb-6">
          <Avatar className="w-16 h-16 mx-auto mb-3">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {user.displayName ? getInitials(user.displayName) : <User size={20} />}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="font-medium mb-1">
            Welcome back{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
          </h3>
          <p className="text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>

        {/* Biometric Authentication Option - Prominent */}
        {biometricSupported && biometricEnrolled && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Fingerprint size={32} className="text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Quick access with your fingerprint
              </p>
            </div>
            <Button
              onClick={() => setShowBiometricPrompt(true)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              <div className="flex items-center space-x-2">
                <Fingerprint size={20} />
                <span>Use Fingerprint</span>
              </div>
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use password
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Enter your password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Unlock'}
          </Button>
        </form>

        {/* Switch Account */}
        {onCancel && (
          <div className="text-center mt-4">
            <button
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out instead
            </button>
          </div>
        )}
      </div>

      {/* Biometric Authentication Prompt */}
      {showBiometricPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <BiometricPrompt
            title="Quick Login"
            description="Use your biometric authentication to continue"
            onSuccess={() => {
              setShowBiometricPrompt(false);
              onSuccess();
            }}
            onCancel={() => setShowBiometricPrompt(false)}
            onFallback={() => setShowBiometricPrompt(false)}
          />
        </div>
      )}
    </div>
  );
};

export default QuickAuthScreen;