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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
  
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile-setup`
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        sessionStorage.setItem('verification-email', formData.email);
        sessionStorage.setItem('signup-data', JSON.stringify({
          display_name: formData.displayName,
          phone_number: formData.phoneNumber,
          username: formData.username,
          user_type: formData.userType
        }));
        
        toast({
          title: "Check your email!",
          description: "We've sent you a verification link.",
        });
        navigate('/email-verification');
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
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <button
                type="button"
                className="flex items-center justify-center space-x-2 mx-auto"
              >
                <Fingerprint size={20} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  🔒 Tap to login with fingerprint
                </span>
              </button>
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
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login to Account'}
            </Button>

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