import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock, Database, MapPin, Shield, Zap } from 'lucide-react';
import TwoFactorLogin from '@/components/TwoFactorLogin';
import { useAuth } from '@/hooks/useAuth';
import LocationSelectionForm from '@/components/LocationSelectionForm';
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
  const [message, setMessage] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/home');
      }
    };
    checkSession();
    
    // Check for referral code from localStorage or set default
    const storedReferralCode = localStorage.getItem('referral_code');
    if (storedReferralCode) {
      setReferralCode(storedReferralCode);
      setIsLogin(false); // Switch to signup mode
    } else {
      setReferralCode('centralexchange');
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
        // Check if user has 2FA enabled
        const has2FA = localStorage.getItem(`2fa_enabled_${data.user.id}`) === 'true';

        if (has2FA) {
          // Show 2FA verification screen
          setPendingUser(data.user);
          setShow2FA(true);
        } else {
          // Direct login without 2FA
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

  const handle2FASuccess = () => {
    toast({
      title: "Welcome back!",
      description: "2FA verification successful. You are now signed in.",
    });
    setShow2FA(false);
    setPendingUser(null);
    navigate('/home');
  };

  const handle2FABack = () => {
    setShow2FA(false);
    setPendingUser(null);
    // Sign out the pending session
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
        // Create profile and handle referral
        try {
          // Create profile first
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
          
          // Handle referral if provided
          if (referralCode && referralCode !== 'centralexchange') {
            console.log('Processing referral code:', referralCode);
            
            const { data: referrerProfiles } = await supabase
              .from('profiles')
              .select('user_id, display_name')
              .not('user_id', 'eq', data.user.id);
            
            console.log('Found profiles:', referrerProfiles);
            
            const referrer = referrerProfiles?.find(profile => {
              const displayName = profile.display_name?.toLowerCase().replace(/[^a-z0-9]/g, '');
              const code = referralCode.toLowerCase();
              console.log('Checking:', { displayName, code });
              return displayName === code;
            });
            
            console.log('Found referrer:', referrer);
            
            if (referrer) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ referred_by: referrer.user_id })
                .eq('user_id', data.user.id);
              
              console.log('Referral update result:', updateError);
            }
          }
        } catch (error) {
          console.log('Profile creation failed:', error);
        }
        
        if (!data.session) {
          // Email confirmation required
          setMessage('Please check your email for a confirmation link to complete your registration.');
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account.",
          });
        } else {
          // Auto-confirmed
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



  // Show 2FA verification if needed
  if (show2FA && pendingUser) {
    return (
      <TwoFactorLogin
        onSuccess={handle2FASuccess}
        onBack={handle2FABack}
        userEmail={pendingUser.email}
      />
    );
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome Back
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Sign in to your Central Exchange account and continue trading crypto securely
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 text-gray-900 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                  Password
                </Label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-14 text-gray-900 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Zap size={20} className="mr-2" />
                    Sign In
                  </div>
                )}
              </Button>



              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* Vendor Login Link */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/vendor/login')}
              className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
              Are you a vendor? Login here
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <User size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Join Central Exchange
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Create your account and start trading crypto with confidence
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold text-gray-800">
                Full Name
              </Label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 text-gray-900 focus:border-green-500 focus:bg-white transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email Address
              </Label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 text-gray-900 focus:border-green-500 focus:bg-white transition-all duration-200"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                Password
              </Label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-14 text-gray-900 focus:border-green-500 focus:bg-white transition-all duration-200"
                  placeholder="Create a strong password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-800">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-14 text-gray-900 focus:border-green-500 focus:bg-white transition-all duration-200"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800">
                Location
              </Label>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 focus-within:border-green-500 transition-all duration-200">
                <LocationSelectionForm
                  selectedCountry={country}
                  selectedState={state}
                  selectedCity={city}
                  onCountryChange={setCountry}
                  onStateChange={setState}
                  onCityChange={setCity}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-sm font-semibold text-gray-800">
                Referral Code (Optional)
              </Label>
              <Input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 text-gray-900 focus:border-green-500 focus:bg-white transition-all duration-200"
                placeholder="Enter referral code"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading || !country || !state}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center">
                  <User size={20} className="mr-2" />
                  Create My Account
                </div>
              )}
            </Button>



            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-green-600 font-semibold hover:text-green-700 transition-colors"
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