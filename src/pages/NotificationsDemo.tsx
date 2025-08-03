import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import PushNotifications from '@/components/PushNotifications';

const NotificationsDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
        </div>
        <button className="p-2">
          <Settings size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Notification Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Trade updates</span>
              <div className="w-10 h-6 bg-blue-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Payment notifications</span>
              <div className="w-10 h-6 bg-blue-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Security alerts</span>
              <div className="w-10 h-6 bg-blue-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <PushNotifications />
      </div>
    </div>
  );
};

export default NotificationsDemo;