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
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4" style={{ overscrollBehavior: 'none', touchAction: 'manipulation' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">CE</span>
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

            <div className="text-center mt-6">
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white px-4 py-6 overflow-y-auto" style={{ overscrollBehavior: 'none', touchAction: 'manipulation' }}>
      <div className="max-w-md mx-auto min-h-full flex flex-col justify-center">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">CE</span>
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