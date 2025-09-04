import React, { useState } from 'react';
import { ArrowLeft, Shield, Key, Eye, EyeOff, Lock, AlertTriangle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Security = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsChangingPassword(true);

      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      setIsLoggingOut(true);

      // Sign out from all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) throw error;

      toast({
        title: "Logged Out",
        description: "You have been logged out from all devices.",
      });

      // Redirect to auth page
      navigate('/auth');

    } catch (error: any) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to logout from all sessions.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <Link to="/settings" className="mr-3">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Security</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Password Settings */}
        <Card className="bg-white p-6">
          <div className="flex items-center mb-4">
            <Key size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Password Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handlePasswordUpdate}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </Card>



        {/* Session Management */}
        <Card className="bg-white p-6">
          <div className="flex items-center mb-4">
            <Shield size={20} className="text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sign out from all devices and sessions for enhanced security.
            </p>

            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogoutAllSessions}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2" size={16} />
              {isLoggingOut ? 'Signing Out...' : 'Sign Out All Devices'}
            </Button>
          </div>
        </Card>

        {/* Security Alerts */}
        <Card className="bg-white p-6 border-orange-200">
          <div className="flex items-center mb-4">
            <AlertTriangle size={20} className="text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
          </div>
          
          <div className="space-y-3">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle size={16} className="text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-orange-900 font-medium">Phone Number Not Verified</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Verify your phone number to secure your account and enable SMS notifications.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 text-orange-600 border-orange-200">
                    Verify Now
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-900 font-medium">Weak Password</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your password doesn't meet our security requirements. Consider updating it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Security;