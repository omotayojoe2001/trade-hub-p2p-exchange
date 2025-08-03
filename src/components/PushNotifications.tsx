import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, DollarSign, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: 'trade' | 'payment' | 'security' | 'premium';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
}

const PushNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Demo notifications
  const demoNotifications: Notification[] = [
    {
      id: '1',
      type: 'trade',
      title: 'Trade Match Found!',
      message: 'MercyPay wants to sell you 0.0045 BTC for ₦125,000. Tap to proceed.',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      isRead: false,
      actionRequired: true
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      message: 'You received ₦558,792 from CryptoKing for 0.021 BTC trade.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      isRead: false
    },
    {
      id: '3',
      type: 'security',
      title: 'Security Alert',
      message: 'New device login detected from Lagos, Nigeria. Was this you?',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      isRead: true,
      actionRequired: true
    },
    {
      id: '4',
      type: 'premium',
      title: 'Premium Feature Unlocked!',
      message: 'Welcome to Premium! You can now access instant withdrawals and priority support.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true
    }
  ];

  useEffect(() => {
    // Simulate real-time notifications
    const timer = setTimeout(() => {
      setNotifications(demoNotifications);
      showNewNotification();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const showNewNotification = () => {
    setIsVisible(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <DollarSign size={20} className="text-green-500" />;
      case 'payment':
        return <Check size={20} className="text-blue-500" />;
      case 'security':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'premium':
        return <Shield size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const latestNotification = notifications.find(n => !n.isRead);

  return (
    <>
      {/* Floating notification popup */}
      {isVisible && latestNotification && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getNotificationIcon(latestNotification.type)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  {latestNotification.title}
                </h4>
                <p className="text-gray-600 text-xs mt-1">
                  {latestNotification.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          {latestNotification.actionRequired && (
            <div className="mt-3 flex space-x-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  markAsRead(latestNotification.id);
                  setIsVisible(false);
                }}
              >
                View Trade
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVisible(false)}
              >
                Later
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notification list component */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-lg p-4 border ${
              notification.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start space-x-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium text-sm ${
                    notification.isRead ? 'text-gray-700' : 'text-gray-900'
                  }`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
                <p className={`text-xs ${
                  notification.isRead ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  {notification.message}
                </p>
                {notification.actionRequired && !notification.isRead && (
                  <div className="mt-2 flex space-x-2">
                    <Button size="sm" className="text-xs">
                      Take Action
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PushNotifications;