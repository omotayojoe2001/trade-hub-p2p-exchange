import React, { useState, useEffect } from 'react';
import { Bell, X, DollarSign, Check, AlertCircle, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'trade' | 'payment' | 'security' | 'premium' | 'update';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
  tradeId?: string;
}

const GlobalNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Demo notifications with actual trade IDs
  const demoNotifications: Notification[] = [
    { id: '1', type: 'trade', title: 'Trade Match Found!', message: 'MercyPay wants to sell you 0.0045 BTC for ₦125,000. Tap to proceed.', timestamp: new Date(Date.now() - 2 * 60 * 1000), isRead: false, actionRequired: true, tradeId: '1' },
    { id: '2', type: 'payment', title: 'Payment Received', message: 'You received ₦558,792 from CryptoKing for 0.021 BTC trade.', timestamp: new Date(Date.now() - 15 * 60 * 1000), isRead: false, tradeId: '2' },
    { id: '3', type: 'security', title: 'Security Alert', message: 'New device login detected from Lagos, Nigeria. Was this you?', timestamp: new Date(Date.now() - 60 * 60 * 1000), isRead: true, actionRequired: true },
    { id: '4', type: 'update', title: 'Platform Update', message: 'Scheduled maintenance tonight at 02:00 WAT. Trading remains available.', timestamp: new Date(Date.now() - 90 * 60 * 1000), isRead: false }
  ];

  useEffect(() => {
    // Initial load
    const initialTimer = setTimeout(() => {
      setNotifications(demoNotifications);
      showNewNotification();
    }, 3000);

    // Show notifications every 40 seconds consistently
    const interval = setInterval(() => {
      showNewNotification();
    }, 40000); // 40 seconds

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const showNewNotification = () => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <DollarSign size={18} className="text-gray-600" />;
      case 'payment':
        return <Check size={18} className="text-gray-600" />;
      case 'security':
        return <AlertCircle size={18} className="text-gray-600" />;
      case 'premium':
        return <Shield size={18} className="text-gray-600" />;
      case 'update':
        return <Bell size={18} className="text-gray-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const handleViewTrade = (tradeId?: string) => {
    if (tradeId) {
      navigate(`/trade-details/${tradeId}`);
    }
    setIsVisible(false);
  };

  const latestNotification = notifications.find(n => !n.isRead);

  return (
    <>
      {/* Floating notification popup */}
      {isVisible && latestNotification && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {getNotificationIcon(latestNotification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {latestNotification.title}
                </h4>
                <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                  {latestNotification.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <X size={16} />
            </button>
          </div>
          {latestNotification.actionRequired && (
            <div className="mt-3 flex space-x-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5"
                onClick={() => handleViewTrade(latestNotification.tradeId)}
              >
                View Trade
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVisible(false)}
                className="text-xs px-3 py-1.5"
              >
                Later
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GlobalNotifications;