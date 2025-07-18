import React, { useState } from 'react';
import { ArrowLeft, Shield, Key, Smartphone, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const Security = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
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
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button className="w-full">
              Update Password
            </Button>
          </div>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="bg-white p-6">
          <div className="flex items-center mb-4">
            <Smartphone size={20} className="text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-900 font-medium">Enable 2FA</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          {twoFactorEnabled && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Setup Instructions</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Download an authenticator app like Google Authenticator or Authy, then scan the QR code below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">QR Code</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <Input
                  placeholder="Enter 6-digit code from your authenticator app"
                  maxLength={6}
                />
              </div>

              <Link to="/enable-2fa">
                <Button className="w-full">
                  Verify and Enable 2FA
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Login Activity */}
        <Card className="bg-white p-6">
          <div className="flex items-center mb-4">
            <Shield size={20} className="text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Login Activity</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Current Session</p>
                <p className="text-sm text-gray-500">Chrome on Windows • Lagos, Nigeria</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Mobile App</p>
                <p className="text-sm text-gray-500">iPhone • 2 hours ago</p>
              </div>
              <Button variant="outline" size="sm">
                Revoke
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Firefox on Mac</p>
                <p className="text-sm text-gray-500">Abuja, Nigeria • 1 day ago</p>
              </div>
              <Button variant="outline" size="sm">
                Revoke
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4">
            Sign Out All Devices
          </Button>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-white p-6">
          <div className="flex items-center mb-4">
            <Lock size={20} className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Profile Visibility</p>
                <p className="text-sm text-gray-500">Allow others to see your profile</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Trade History</p>
                <p className="text-sm text-gray-500">Show trading activity to other users</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Online Status</p>
                <p className="text-sm text-gray-500">Show when you're online</p>
              </div>
              <Switch defaultChecked />
            </div>
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