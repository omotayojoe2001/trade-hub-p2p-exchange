import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission === 'granted';
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  };

  const subscribeToTrades = (userId: string) => {
    const channel = supabase
      .channel('trade-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            sendNotification('Trade Update', {
              body: 'Your trade status has been updated',
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    subscribeToTrades,
  };
};