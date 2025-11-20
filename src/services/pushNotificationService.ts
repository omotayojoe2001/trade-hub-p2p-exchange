import { supabase } from '@/integrations/supabase/client';

// Capacitor imports with error handling
let PushNotifications: any = null;
let Capacitor: any = null;

try {
  const capacitorCore = require('@capacitor/core');
  const capacitorPush = require('@capacitor/push-notifications');
  Capacitor = capacitorCore.Capacitor;
  PushNotifications = capacitorPush.PushNotifications;
} catch (error) {
  console.log('Capacitor not available, using web fallback');
}

export interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export const pushNotificationService = {
  // Request permission and register for push notifications
  async requestPermission(): Promise<boolean> {
    console.log('Requesting push notification permission...');
    
    try {
      if (Capacitor && Capacitor.isNativePlatform()) {
        console.log('Using native push notifications');
        const result = await PushNotifications.requestPermissions();
        console.log('Native permission result:', result);
        return result.receive === 'granted';
      } else {
        console.log('Using web push notifications');
        if (!('Notification' in window)) {
          console.error('Notifications not supported in this browser');
          return false;
        }
        
        const permission = await Notification.requestPermission();
        console.log('Web permission result:', permission);
        return permission === 'granted';
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  // Register for push notifications
  async registerPushSubscription(userId: string): Promise<boolean> {
    try {
      if (Capacitor && Capacitor.isNativePlatform()) {
        console.log('Registering for native push notifications...');
        
        await PushNotifications.register();
        
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: 'native-mobile',
            p256dh: 'native',
            auth: 'native',
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        return true;
      } else {
        if (!('serviceWorker' in navigator)) {
          console.error('Service workers not supported');
          return false;
        }

        console.log('Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        if (!registration.pushManager) {
          console.error('Push manager not available');
          return false;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'BB8V5J-QRu5aQUnOov7ah6JkBSXFJjYkYElqFdND58bgNZMQQ8nJLQ6Vl8KdAEbaiO6HeU9hsGkMMsXZwotlTOU'
          )
        });

        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error registering push subscription:', error);
      return false;
    }
  },

  initializePushNotifications() {
    if (Capacitor && Capacitor.isNativePlatform() && PushNotifications) {
      console.log('Initializing native push notification listeners');
      
      PushNotifications.addListener('registration', (token: any) => {
        console.log('Push registration success, token: ' + token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
        console.log('Push notification received: ', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
        console.log('Push notification action performed', notification);
      });
    }
  },

  // Send push notification
  async sendNotification(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title,
          body,
          data,
          vibrate: [200, 100, 200]
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  },

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};