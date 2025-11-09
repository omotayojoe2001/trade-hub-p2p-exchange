import { supabase } from '@/integrations/supabase/client';

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
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Register service worker and get push subscription
  async registerPushSubscription(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BB8V5J-QRu5aQUnOov7ah6JkBSXFJjYkYElqFdND58bgNZMQQ8nJLQ6Vl8KdAEbaiO6HeU9hsGkMMsXZwotlTOU' // Your VAPID public key
        )
      });

      // Save subscription to database
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
    } catch (error) {
      console.error('Error registering push subscription:', error);
      return false;
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
          vibrate: [200, 100, 200] // Vibration pattern
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