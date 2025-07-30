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
    id: string;
    email: string;
    displayName: string;
    lastLoginAt: string;
  };
  onSuccess: () => void;
  onSwitchAccount: () => void;
}

const QuickAuthScreen: React.FC<QuickAuthScreenProps> = ({
  user,
  onSuccess,
  onSwitchAccount
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
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onSwitchAccount}
            className="p-2 -ml-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">Quick Login</span>
        </div>

        {/* User Profile Section */}
        <div className="text-center mb-8">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-xl font-semibold text-black mb-1">
            Welcome back, {user.displayName.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-500 mb-1">
            {user.email}
          </p>
          <p className="text-xs text-gray-400">
            Last active {formatLastLogin(user.lastLoginAt)}
          </p>
        </div>

        {/* Biometric Authentication Option */}
        {biometricSupported && biometricEnrolled && (
          <div className="mb-6">
            <Button
              onClick={() => setShowBiometricPrompt(true)}
              className="w-full h-14 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl"
              variant="outline"
            >
              <div className="flex items-center space-x-3">
                <Fingerprint size={24} />
                <div className="text-left">
                  <div className="font-medium">Use Biometric</div>
                  <div className="text-xs opacity-70">Fingerprint or Face ID</div>
                </div>
              </div>
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-xs text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Enter your password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg px-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
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
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Continue'}
          </Button>
        </form>

        {/* Switch Account */}
        <div className="text-center mt-6">
          <button
            onClick={onSwitchAccount}
            className="text-sm text-blue-500 font-medium"
          >
            Not you? Switch account
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <span>🔒</span>
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
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