import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import TwoFactorLogin from '@/components/TwoFactorLogin';
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
  const [message, setMessage] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/home');
      }
    };
    checkSession();
    
    const storedReferralCode = localStorage.getItem('referral_code');
    if (storedReferralCode) {
      setReferralCode(storedReferralCode);
      setIsLogin(false);
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
        const has2FA = localStorage.getItem(`2fa_enabled_${data.user.id}`) === 'true';

        if (has2FA) {
          setPendingUser(data.user);
          setShow2FA(true);
        } else {
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
          
          if (referralCode && referralCode !== 'centralexchange') {
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
              await supabase
                .from('profiles')
                .update({ referred_by: referrer.user_id })
                .eq('user_id', data.user.id);
            }
          }
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
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome Back
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Sign in to your Central Exchange account
            </p>
          </div>

          <div className="bg-white p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-800">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-12 pr-4"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-800">
                  Password
                </Label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 pr-14"
                    placeholder="Enter your password"
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
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 font-medium"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </form>
          </div>

          <div className="text-center mt-6 pt-4">
            <button
              type="button"
              onClick={() => navigate('/vendor/login')}
              className="text-sm text-gray-500 font-medium"
            >
              Are you a vendor? Login here
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Join Central Exchange
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Create your account and start trading crypto
          </p>
        </div>

        <div className="bg-white p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-800">
                Full Name
              </Label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 pl-12 pr-4"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-800">
                Email Address
              </Label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 pr-4"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-800">
                Password
              </Label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-14"
                  placeholder="Create a password (min 6 characters)"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-800">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-12 pr-14"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-800">
                Location
              </Label>
              <EnhancedLocationSelector
                selectedCountry={country}
                selectedState={state}
                selectedCity={city}
                onCountryChange={setCountry}
                onStateChange={setState}
                onCityChange={setCity}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-sm font-medium text-gray-800">
                Referral Code (Optional)
              </Label>
              <Input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="h-12 px-4"
                placeholder="Enter referral code"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={loading || !country || !state}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 font-medium"
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