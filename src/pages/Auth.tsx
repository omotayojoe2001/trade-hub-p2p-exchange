
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, AtSign, Mail, Phone, Fingerprint, Database, ArrowLeft, Gift, Check } from 'lucide-react';
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import BiometricPrompt from "@/components/BiometricPrompt";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    username: '',
    phoneNumber: '',
    referralCode: '',
    userType: 'customer',
    agreeToTerms: false
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSupported: biometricSupported, isEnrolled: biometricEnrolled } = useBiometricAuth();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/home');
      }
    };
    checkSession();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const cleanupAuthState = () => {
    // Remove all Supabase auth keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Clean up any existing auth state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
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
        // Navigate without full page reload
        navigate('/home');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Clean up any existing auth state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile-setup`,
          data: {
            display_name: formData.displayName,
            username: formData.username,
            phone_number: formData.phoneNumber,
            user_type: formData.userType
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Create profile directly since auto_confirm_email is true
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            display_name: formData.displayName,
            username: formData.username,
            phone_number: formData.phoneNumber,
            user_type: formData.userType,
            is_merchant: formData.userType === 'merchant',
            profile_completed: false // Allow profile setup to complete it
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
        
        toast({
          title: "Account created!",
          description: "Welcome to CryptoHub! Complete your profile setup.",
        });
        
        // Navigate to profile setup
        navigate('/profile-setup');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Clean up any existing auth state
      cleanupAuthState();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile-setup`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isLogin) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-sm mx-auto">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Database size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">
              Welcome Back 👋
            </h1>
            <p className="text-sm text-gray-600">
              Login to continue your crypto trades
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email/Username Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email or Username
              </Label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="sarah@example.com or sarah123"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-blue-500 font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
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

            {/* Biometric Option */}
            {biometricSupported && biometricEnrolled && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowBiometricPrompt(true)}
                  className="flex items-center justify-center space-x-2 mx-auto"
                >
                  <Fingerprint size={20} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    🔒 Tap to login with biometric
                  </span>
                </button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* CTA Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login to Account'}
            </Button>

            {/* Google Sign In */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-3">Or continue with</div>
              <Button
                type="button"
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full h-12 border border-gray-300 text-gray-700 font-medium rounded-lg"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Connecting...' : 'Continue with Google'}
              </Button>
            </div>

            {/* Footer Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                📱 Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-blue-500 font-medium"
                >
                  Create one
                </button>
              </p>
            </div>

            {/* Security Note */}
            <div className="text-center pt-6">
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                <span>🔒</span>
                <span>Your credentials are encrypted. Login is protected by 256-bit security</span>
              </div>
            </div>
          </form>
        </div>
        
        {/* Biometric Authentication Prompt */}
        {showBiometricPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <BiometricPrompt
              title="Login with Biometric"
              description="Use your fingerprint or face recognition to login quickly"
              onSuccess={() => {
                setShowBiometricPrompt(false);
                navigate('/home');
              }}
              onCancel={() => setShowBiometricPrompt(false)}
              onFallback={() => setShowBiometricPrompt(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className="p-2 -ml-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-black ml-2">
            Create Account
          </h1>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-2">
            Join CryptoHub
          </h2>
          <p className="text-sm text-gray-600">
            Create your account to start trading crypto securely
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1">
            <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleInputChange}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <div className="relative">
              <AtSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a username"
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <div className="flex">
              <div className="flex items-center bg-white border border-gray-300 border-r-0 rounded-l-lg px-3">
                <span className="text-lg mr-1">🇳🇬</span>
                <span className="text-sm text-gray-600">+234</span>
              </div>
              <div className="relative flex-1">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="h-12 bg-white border border-gray-300 rounded-r-lg border-l-0 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="8012345678"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className="h-12 bg-white border border-gray-300 rounded-lg px-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a strong password"
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

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="h-12 bg-white border border-gray-300 rounded-lg px-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Referral Code Input */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                Referral Code (Optional)
              </Label>
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={10} className="text-white" />
              </div>
            </div>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={handleInputChange}
              className="h-12 bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter referral code"
            />
            <p className="text-xs text-gray-500">
              Enter a referral code if you have one. If not, cryptohub will be used by default.
            </p>
          </div>

          {/* Referral Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <span className="text-sm mr-2">📌</span>
              <p className="text-xs text-blue-700">
                🎁 Earn with Referrals! You'll get a % commission on every trade made by users you refer.
              </p>
            </div>
          </div>

          {/* User Type Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Sign Up As
            </Label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, userType: 'customer'})}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                  formData.userType === 'customer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-sm text-black">Customer</h4>
                  <p className="text-xs text-gray-600">Buy or sell crypto directly. Fast, secure, reliable.</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  formData.userType === 'customer' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {formData.userType === 'customer' && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, userType: 'merchant'})}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                  formData.userType === 'merchant'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Gift size={20} className="text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-sm text-black">Merchant</h4>
                  <p className="text-xs text-gray-600">Become a trusted trader. Handle orders and receive payments.</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  formData.userType === 'merchant' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {formData.userType === 'merchant' && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2 py-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
              I agree to the Terms and Privacy Policy
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* CTA Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
            disabled={!formData.agreeToTerms || loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Google Sign Up */}
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-3">Or sign up with</div>
            <Button
              type="button"
              onClick={handleGoogleAuth}
              variant="outline"
              className="w-full h-12 border border-gray-300 text-gray-700 font-medium rounded-lg"
              disabled={loading || !formData.agreeToTerms}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </div>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-blue-500 font-medium"
              >
                Log In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
