
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6" style={{ fontFamily: 'Poppins' }}>
        Settings
      </h1>

      {/* KYC Banner */}
      <Card className="p-4 bg-gray-50 border border-gray-300 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
            Complete KYC verification
          </p>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" style={{ fontFamily: 'Poppins' }}>
            Verify Now
          </Button>
        </div>
      </Card>

      {/* Profile Section */}
      <div className="mb-6">
        <div className="border-b border-gray-200 pb-2 mb-4">
          <h2 className="text-base font-medium text-gray-800" style={{ fontFamily: 'Poppins' }}>
            Profile & Account
          </h2>
        </div>
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>
                Sarah Johnson
              </h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
                sarah.johnson@example.com
              </p>
            </div>
            <Button variant="ghost" className="text-blue-500 text-sm font-medium" style={{ fontFamily: 'Inter' }}>
              Edit Profile
            </Button>
          </div>
        </Card>
      </div>

      {/* Bank Accounts */}
      <div className="mb-6">
        <div className="border-b border-gray-200 pb-2 mb-4">
          <h2 className="text-base font-medium text-gray-800" style={{ fontFamily: 'Poppins' }}>
            Bank Accounts
          </h2>
        </div>
        <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800" style={{ fontFamily: 'Poppins' }}>
                  GT Bank
                </p>
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
                  ••••4875
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Button variant="ghost" className="text-blue-500 text-sm font-medium" style={{ fontFamily: 'Inter' }}>
              + Add Account
            </Button>
          </div>
        </Card>
      </div>

      {/* Referral Program */}
      <div className="mb-6">
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1" style={{ fontFamily: 'Inter' }}>
                Total Referrals
              </p>
              <p className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                18
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 mb-1" style={{ fontFamily: 'Inter' }}>
                Earnings
              </p>
              <p className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                ₦36,200
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
              Lifetime Commission Rate: 5%
            </p>
            <p className="text-sm text-blue-500" style={{ fontFamily: 'monospace' }}>
              Referral Code: cryptohub
            </p>
          </div>
          
          <div className="text-center">
            <Button variant="ghost" className="text-blue-500 text-sm font-medium" style={{ fontFamily: 'Inter' }}>
              View All Referrals
            </Button>
          </div>
        </Card>
      </div>

      {/* Security & Preferences */}
      <div className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
              Change Password
            </span>
            <Switch checked={false} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
              Enable Fingerprint
            </span>
            <Switch 
              checked={fingerprintEnabled} 
              onCheckedChange={setFingerprintEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
              Logout of Other Devices
            </span>
            <Switch checked={false} />
          </div>
        </div>
      </div>

      {/* Legal/Help */}
      <div className="mb-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Inter' }}>
            Help & Legal | FAQs | Terms
          </p>
          <p className="text-sm font-medium text-blue-500" style={{ fontFamily: 'Inter' }}>
            Contact Support [✓]
          </p>
          <p className="text-xs font-light text-gray-400" style={{ fontFamily: 'Inter' }}>
            App Version: v1.0.0
          </p>
        </div>
      </div>

      {/* Logout Button */}
      <div className="text-center">
        <Button className="h-10 bg-transparent text-red-400 font-medium hover:bg-red-50" style={{ fontFamily: 'Poppins' }}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Settings;
