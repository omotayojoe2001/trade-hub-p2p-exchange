import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import TwoFactorAuthPage from '@/components/TwoFactorAuthPage';
import { useAuth } from '@/hooks/useAuth';
import EnhancedLocationSelector from '@/components/EnhancedLocationSelector';
import { countries } from '@/data/countries';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('NG');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{email: string, password: string} | null>(null);
  const [message, setMessage] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    const refCode = urlParams.get('ref');
    
    // Check for password reset BEFORE session check
    if (accessToken && type === 'recovery') {
      // Establish session immediately
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });
      setShowPasswordReset(true);
      return;
    }
    
    // Also check for manual recovery parameter
    if (type === 'recovery') {
      setShowPasswordReset(true);
      return;
    }
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if 2FA is enabled for existing session
        const { twoFactorAuthService } = await import('@/services/twoFactorAuthService');
        const has2FA = await twoFactorAuthService.is2FAEnabled(session.user.id);
        
        console.log('Existing session - User ID:', session.user.id);
        console.log('Existing session - Has 2FA:', has2FA);
        
        if (has2FA) {
          // Check if 2FA was completed in this browser session (not localStorage)
          const sessionKey = `2fa_verified_${session.user.id}`;
          const twoFAVerified = sessionStorage.getItem(sessionKey) === 'true';
          
          console.log('Existing session with 2FA - verified in session:', twoFAVerified);
          
          if (!twoFAVerified) {
            console.log('2FA not verified in this session - showing 2FA screen');
            setPendingUser(session.user);
            setShow2FA(true);
          } else {
            console.log('2FA already verified this session - going to home');
            navigate('/home');
          }
        } else {
          console.log('Existing session without 2FA - going to home');
          navigate('/home');
        }
      }
    };
    
    checkSession();
    
    // Handle referral code from URL or localStorage
    if (refCode) {
      setReferralCode(refCode);
      localStorage.setItem('referral_code', refCode);
      setIsLogin(false); // Switch to signup if referral code present
    } else {
      const storedReferralCode = localStorage.getItem('referral_code');
      if (storedReferralCode) {
        setReferralCode(storedReferralCode);
        setIsLogin(false);
      } else {
        setReferralCode('centralexchange');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user && data.session) {
        // Check if 2FA is enabled in database
        const { twoFactorAuthService } = await import('@/services/twoFactorAuthService');
        const has2FA = await twoFactorAuthService.is2FAEnabled(data.user.id);
        
        console.log('Login check - User ID:', data.user.id);
        console.log('Login check - Has 2FA:', has2FA);

        if (has2FA) {
          console.log('2FA enabled - showing 2FA screen');
          // Always require 2FA verification on fresh login
          setPendingUser(data.user);
          setShow2FA(true);
        } else {
          console.log('No 2FA - going to home');
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate('/home');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

      if (error) {
        setError(error.message);
        return;
      }

      setMessage('Password reset email sent! Check your inbox.');
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
      
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setMessage('');
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Session should already be established
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
      });
      
      setShowPasswordReset(false);
      navigate('/home');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    // Mark 2FA as completed for this browser session only
    if (pendingUser) {
      const sessionKey = `2fa_verified_${pendingUser.id}`;
      sessionStorage.setItem(sessionKey, 'true');
    }
    
    toast({
      title: "Welcome back!",
      description: "2FA verification successful. You are now signed in.",
    });
    setShow2FA(false);
    setPendingUser(null);
    setPendingCredentials(null);
    navigate('/home');
  };

  const handle2FABack = () => {
    setShow2FA(false);
    setPendingUser(null);
    setPendingCredentials(null);
    supabase.auth.signOut();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        try {
          const countryData = countries.find(c => c.code === country);
          const stateData = countryData?.states.find(s => s.code === state);
          
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            email: data.user.email,
            display_name: fullName,
            location: `${city}, ${stateData?.name || state}, ${countryData?.name || country}`,
            country: country,
            state: state,
            city: city
          });
          
          // Process referral if code provided
          if (referralCode && referralCode !== 'centralexchange') {
            try {
              // Find referrer by display name matching referral code
              const { data: referrerProfiles } = await supabase
                .from('profiles')
                .select('user_id, display_name')
                .not('user_id', 'eq', data.user.id);
              
              const referrer = referrerProfiles?.find(profile => {
                const displayName = profile.display_name?.toLowerCase().replace(/[^a-z0-9]/g, '');
                const code = referralCode.toLowerCase();
                return displayName === code;
              });
              
              if (referrer) {
                // Call the referral signup function
                await supabase.rpc('process_referral_signup', {
                  new_user_id: data.user.id,
                  referrer_user_id: referrer.user_id,
                  referral_code_used: referralCode
                });
                
                console.log('Referral processed successfully');
              }
            } catch (error) {
              console.error('Error processing referral:', error);
            }
          }
          
          // Clear referral code from localStorage after use
          localStorage.removeItem('referral_code');
        } catch (error) {
          console.log('Profile creation failed:', error);
        }
        
        if (!data.session) {
          setMessage('Please check your email for a confirmation link to complete your registration.');
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account.",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Central Exchange!",
          });
          navigate('/home');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordReset) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4">
              <img src="/centralexchange-logo.png" alt="Central Exchange" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Password
            </h1>
            <p className="text-gray-500 text-sm">
              Enter your new password
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-14 px-4 bg-gray-50 border-0 rounded-xl text-base"
                placeholder="New Password"
                required
              />

              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="h-14 px-4 bg-gray-50 border-0 rounded-xl text-base"
                placeholder="Confirm New Password"
                required
              />

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (show2FA && pendingUser) {
    return (
      <TwoFactorAuthPage
        onSuccess={handle2FASuccess}
        onBack={handle2FABack}
        userEmail={pendingUser.email}
        pendingUser={pendingUser}
      />
    );
  }

  if (isLogin) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4" style={{ overscrollBehavior: 'none', touchAction: 'manipulation' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4">
              <img src="/centralexchange-logo.png" alt="Central Exchange" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to continue trading
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 px-4 bg-gray-50 border-0 rounded-xl text-base"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 px-4 pr-12 bg-gray-50 border-0 rounded-xl text-base"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 text-sm font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 font-semibold"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/vendor/login')}
              className="text-sm text-gray-400"
            >
              Vendor Login
            </button>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Reset Password
              </h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <p className="text-green-600 text-sm">{message}</p>
                </div>
              )}
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-12 px-4 bg-gray-50 border-0 rounded-xl"
                  placeholder="Enter your email"
                  required
                />
                
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setError('');
                      setMessage('');
                    }}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white px-4 py-6 overflow-y-auto" style={{ overscrollBehavior: 'none', touchAction: 'manipulation' }}>
      <div className="max-w-md mx-auto min-h-full flex flex-col justify-center">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-3">
            <img src="/centralexchange-logo.png" alt="Central Exchange" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Create Account
          </h1>
          <p className="text-gray-500 text-sm">
            Join thousands of crypto traders
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-blue-600 text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3">
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 px-4 bg-gray-50 border-0 rounded-xl"
              placeholder="Full Name"
              required
            />

            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 bg-gray-50 border-0 rounded-xl"
              placeholder="Email"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 pr-12 bg-gray-50 border-0 rounded-xl"
                placeholder="Password (min 6 characters)"
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

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 px-4 pr-12 bg-gray-50 border-0 rounded-xl"
                placeholder="Confirm Password"
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

            <div className="bg-gray-50 rounded-xl p-3">
              <EnhancedLocationSelector
                selectedCountry={country}
                selectedState={state}
                selectedCity={city}
                onCountryChange={setCountry}
                onStateChange={setState}
                onCityChange={setCity}
              />
            </div>

            <Input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="h-12 px-4 bg-gray-50 border-0 rounded-xl"
              placeholder="Referral Code (Optional)"
            />

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold mt-4"
              disabled={loading || !country || !state}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center mt-4">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 font-semibold"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;