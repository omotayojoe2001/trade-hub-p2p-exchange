import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock, Database, MapPin } from 'lucide-react';
import TwoFactorLogin from '@/components/TwoFactorLogin';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
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
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            email: data.user.email,
            display_name: fullName,
            location: location
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
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Database size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600">
              Login to continue your crypto trades
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>



            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-blue-500 font-medium"
                >
                  Create one
                </button>
              </p>
            </div>
          </form>

          {/* Vendor Login Link */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/vendor/login')}
              className="text-sm text-gray-500 hover:text-blue-500 font-medium"
            >
              Vendor Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">
            Create Account
          </h1>
          <p className="text-sm text-gray-600">
            Join Central Exchange to start trading
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-12"
                placeholder="Create a password (min 6 characters)"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-12"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">
              Location
            </Label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4"
                placeholder="Enter your city/location"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-lg px-4"
              placeholder="Enter referral code"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>



          <div className="text-center">
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