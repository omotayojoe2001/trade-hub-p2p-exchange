
import React from 'react';
import { ArrowLeft, Bell, ChevronRight, User, Shield, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

const Settings = () => {
  const settingsOptions = [
    {
      icon: <User size={20} className="text-blue-600" />,
      title: 'Profile Settings',
      description: 'Manage your personal information',
      hasChevron: true
    },
    {
      icon: <Shield size={20} className="text-green-600" />,
      title: 'Security',
      description: '2FA, password, and privacy settings',
      hasChevron: true
    },
    {
      icon: <CreditCard size={20} className="text-purple-600" />,
      title: 'Payment Methods',
      description: 'Manage your bank accounts and cards',
      hasChevron: true
    },
    {
      icon: <Bell size={20} className="text-orange-600" />,
      title: 'Notifications',
      description: 'Push notifications and email alerts',
      hasChevron: true
    },
    {
      icon: <HelpCircle size={20} className="text-gray-600" />,
      title: 'Help & Support',
      description: 'Contact us and view FAQs',
      hasChevron: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
        </div>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Settings Options */}
      <div className="p-4 space-y-4">
        {settingsOptions.map((option, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
              {option.hasChevron && (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="p-4">
        <div className="bg-white rounded-lg p-4 border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <LogOut size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-600">Logout</h3>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Settings;
