import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { pushNotificationService } from '@/services/pushNotificationService';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  const requestPermission = async () => {
    if (!user?.id) return false;
    
    const granted = await pushNotificationService.requestPermission();
    if (granted) {
      const subscribed = await pushNotificationService.registerPushSubscription(user.id);
      setIsSubscribed(subscribed);
      return subscribed;
    }
    return false;
  };

  const sendNotification = async (userId: string, title: string, body: string, data?: any) => {
    return await pushNotificationService.sendNotification(userId, title, body, data);
  };

  return {
    isSupported,
    isSubscribed,
    requestPermission,
    sendNotification
  };
};