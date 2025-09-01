import React, { useState, useEffect } from 'react';
import { Bell, X, DollarSign, Check, AlertCircle, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, realtimeService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Load notifications from Supabase
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        const dbNotifications = await notificationService.getNotifications(user.id);
        
        // Transform Supabase data to our format
        const transformedNotifications = dbNotifications.map((notif: any) => ({
          id: notif.id,
          type: notif.type as any,
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.created_at),
          isRead: notif.read,
          actionRequired: notif.type === 'trade_request' || notif.type === 'security',
          tradeId: notif.trade_id
        }));
        
        setNotifications(transformedNotifications);
        
        // Show notification if there are unread ones
        const unreadCount = transformedNotifications.filter(n => !n.isRead).length;
        if (unreadCount > 0) {
          showNewNotification();
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = realtimeService.subscribeToNotifications(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = {
          id: payload.new.id,
          type: payload.new.type as any,
          title: payload.new.title,
          message: payload.new.message,
          timestamp: new Date(payload.new.created_at),
          isRead: payload.new.read,
          actionRequired: payload.new.type === 'trade_request' || payload.new.type === 'security',
          tradeId: payload.new.trade_id
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        showNewNotification();
        
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

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

  const handleViewTrade = async (tradeId?: string) => {
    try {
      if (latestNotification) {
        // Mark as read in Supabase
        await notificationService.markAsRead(latestNotification.id);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === latestNotification.id ? { ...n, isRead: true } : n)
        );
      }
      
      if (tradeId) {
        navigate(`/trade-details/${tradeId}`);
      }
      setIsVisible(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
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