import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { pushNotificationService } from '@/services/pushNotificationService';

// Capacitor import with error handling
let Capacitor: any = null;
try {
  const capacitorCore = require('@capacitor/core');
  Capacitor = capacitorCore.Capacitor;
} catch (error) {
  console.log('Capacitor not available');
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const isNative = Capacitor && Capacitor.isNativePlatform();
    const notificationSupported = 'Notification' in window;
    const serviceWorkerSupported = 'serviceWorker' in navigator;
    
    console.log('🔔 Notification support check:');
    console.log('- Is native platform:', isNative);
    console.log('- Notification in window:', notificationSupported);
    console.log('- serviceWorker in navigator:', serviceWorkerSupported);
    console.log('- User agent:', navigator.userAgent);
    console.log('- Is HTTPS:', location.protocol === 'https:');
    
    const supported = isNative || (notificationSupported && serviceWorkerSupported);
    console.log('- Overall supported:', supported);
    
    setIsSupported(supported);
    
    if (isNative) {
      pushNotificationService.initializePushNotifications();
    }
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