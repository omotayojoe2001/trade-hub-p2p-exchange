import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  id: string;
  type: 'trade_update' | 'payment_received' | 'kyc_approved' | 'system_alert';
  title: string;
  message: string;
  userId: string;
  createdAt: string;
}

export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  };

  const subscribeToUserNotifications = (userId: string) => {
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as NotificationData;
          setNotifications(prev => [notification, ...prev]);
          
          // Show browser notification
          sendBrowserNotification(notification.title, notification.message);
          
          // Show toast
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          sendBrowserNotification(
            'Trade Update',
            `Your trade status has been updated to ${payload.new.status}`
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => supabase.removeChannel(channel);
  };

  return {
    notifications,
    isConnected,
    requestNotificationPermission,
    subscribeToUserNotifications,
    sendBrowserNotification,
  };
};