import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Shield, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vendorAuthService } from '@/services/vendorAuthService';
import { supabase } from '@/integrations/supabase/client';

const VendorLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use Supabase auth directly instead of custom service
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier.includes('@') ? identifier : `${identifier}@vendor.local`,
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed');

      // Check if user has vendor role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) throw profileError;
      if (profile.role !== 'vendor') {
        throw new Error('Access denied. Vendor role required.');
      }

      // Get vendor profile
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (vendorError) throw vendorError;

      // Store vendor info in localStorage
      localStorage.setItem('vendor_id', vendorProfile.id);
      localStorage.setItem('vendor_user_id', authData.user.id);

      // Redirect to vendor dashboard
      navigate('/vendor/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate('/')} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">
            Vendor Portal
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Vendor Login
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Access your vendor dashboard to manage deliveries and pickups
            </p>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone Number
                </label>
                <Input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or phone"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading ? 'Signing In...' : 'Sign In to Vendor Portal'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Need vendor access?
                </p>
                <button
                  onClick={() => navigate('/contact')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Contact Administrator
                </button>
              </div>
            </div>

            {/* Vendor Features Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Vendor Portal Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Manage cash pickup & delivery jobs</li>
                <li>• Confirm payments from buyers</li>
                <li>• Track delivery status and locations</li>
                <li>• Generate verification codes</li>
                <li>• View earnings and activity logs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center p-4 text-sm text-gray-500">
        <p>TradeHub Vendor Portal - Secure & Reliable</p>
      </div>
    </div>
  );
};

export default VendorLogin;
