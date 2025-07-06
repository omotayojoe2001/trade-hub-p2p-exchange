
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, ArrowLeft, ChevronRight, Edit, Users, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-lg">SJ</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>
        <Bell size={24} className="text-gray-600" />
      </div>

      <div className="p-4 space-y-6">
        {/* KYC Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm">⚠</span>
            </div>
            <span className="text-sm font-medium text-gray-800">Complete KYC verification</span>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm rounded-lg">
            Verify Now
          </Button>
        </div>

        {/* Profile & Account */}
        <div>
          <h2 className="text-base font-semibold text-blue-600 mb-4">Profile & Account</h2>
          <Card className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sarah Johnson</h3>
                <p className="text-sm text-gray-600">sarah.johnson@example.com</p>
              </div>
              <div className="flex items-center text-green-600">
                <span className="text-sm mr-1">✓</span>
                <span className="text-sm font-medium">Verified</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
              <Edit size={16} className="mr-2" />
              Edit Profile
            </Button>
          </Card>
        </div>

        {/* Bank Accounts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-blue-600">Bank Accounts</h2>
            <span className="text-sm text-blue-600 font-medium">Manage All</span>
          </div>
          <div className="space-y-3">
            <Card className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm font-bold">🏦</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GTBank</p>
                    <p className="text-sm text-gray-500">••••4875</p>
                  </div>
                </div>
                <button className="text-gray-400">
                  <span className="text-lg">⋮</span>
                </button>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm font-bold">🏦</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">First Bank</p>
                    <p className="text-sm text-gray-500">••••2390</p>
                  </div>
                </div>
                <button className="text-gray-400">
                  <span className="text-lg">⋮</span>
                </button>
              </div>
            </Card>
            <Button variant="ghost" className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
              <span className="mr-2">+</span>
              Add Account
            </Button>
          </div>
        </div>

        {/* Referral Program */}
        <div>
          <h2 className="text-base font-semibold text-blue-600 mb-4">Referral Program</h2>
          <Card className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">18</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₦36,200</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Lifetime Commission Rate</p>
              <p className="text-lg font-semibold text-gray-900">5%</p>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Referral Code</p>
                  <p className="font-mono font-medium text-gray-900">cryptohub</p>
                </div>
                <Copy size={20} className="text-gray-400" />
              </div>
            </div>
            <Button variant="ghost" className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
              <Users size={16} className="mr-2" />
              View All Referrals
            </Button>
          </Card>
        </div>

        {/* Security & Access */}
        <div>
          <h2 className="text-base font-semibold text-blue-600 mb-4">Security & Access</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">🔑</span>
                <span className="text-gray-900 font-medium">Change Password</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">🔒</span>
                <span className="text-gray-900 font-medium">Enable Fingerprint</span>
              </div>
              <Switch 
                checked={fingerprintEnabled} 
                onCheckedChange={setFingerprintEnabled}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">📱</span>
                <span className="text-gray-900 font-medium">Logout of Other Devices</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Help & Legal */}
        <div>
          <h2 className="text-base font-semibold text-blue-600 mb-4">Help & Legal</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">❓</span>
                <span className="text-gray-900 font-medium">FAQ: How does P2P work?</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">📄</span>
                <span className="text-gray-900 font-medium">Terms & Conditions</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">💬</span>
                <span className="text-gray-900 font-medium">Contact Support</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">App Version: v1.0.0</p>
        </div>

        {/* Logout Button */}
        <div className="pb-8">
          <Button className="w-full bg-transparent text-red-500 hover:bg-red-50 font-medium border-0">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
