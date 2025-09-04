
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, User, Store } from 'lucide-react';

const ProfileSetup = () => {
  const [userType, setUserType] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      setCurrentUser(session.user);

      // Check if user already has a completed profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // Also check user_profiles table
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if ((existingProfile && existingProfile.profile_completed) || userProfile) {
        // Profile already completed, redirect to home
        console.log('Profile completed, redirecting to home');
        navigate('/home');
        return;
      }

      // Check if this is a Google auth user without profile data
      if (session.user.app_metadata?.provider === 'google') {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: session.user.id,
            display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            username: session.user.email?.split('@')[0] || 'user',
            user_type: 'customer',
            is_merchant: false,
            profile_completed: false
          });

        if (error) {
          console.error('Error creating Google profile:', error);
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleProfileSetup = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create/update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: currentUser.id,
          display_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          user_type: userType,
          is_merchant: userType === 'merchant',
          profile_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.warn('Profiles update failed:', profileError.message);
      }

      // Also ensure user_profiles table exists
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          is_premium: false,
          verification_level: 'basic',
          trade_count: 0,
          rating: 5.0,
          total_volume: 0,
          preferred_payment_methods: ['bank_transfer']
        }, { onConflict: 'user_id' });

      if (userProfileError) {
        console.warn('User profiles update failed:', userProfileError.message);
      }

      toast({
        title: "Profile setup complete!",
        description: `Welcome to Central Exchange as a ${userType}.`,
      });

      // Force redirect to break any loops
      console.log('Profile setup completed, redirecting to home...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Central Exchange!</CardTitle>
          <CardDescription>
            Let's set up your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-base font-medium">Choose your account type:</div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setUserType('customer')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userType === 'customer' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-center">
                  <h3 className="font-semibold">Customer</h3>
                  <p className="text-sm text-gray-600">Buy crypto from merchants</p>
                </div>
              </button>

              <button
                onClick={() => setUserType('merchant')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userType === 'merchant' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Store className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-center">
                  <h3 className="font-semibold">Merchant</h3>
                  <p className="text-sm text-gray-600">Sell crypto to customers</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-800">Good to know</span>
            </div>
            <p className="text-sm text-yellow-700">
              You can switch between customer and merchant modes anytime from your profile settings.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleProfileSetup}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
