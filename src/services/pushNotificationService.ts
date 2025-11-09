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
    console.log('Checking notification support...');
    
    if (!('Notification' in window)) {
      console.error('Notifications not supported in this browser');
      return false;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers not supported in this browser');
      return false;
    }

    console.log('Current notification permission:', Notification.permission);
    
    try {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  // Register service worker and get push subscription
  async registerPushSubscription(userId: string): Promise<boolean> {
    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration);
      
      await navigator.serviceWorker.ready;
      console.log('Service worker ready');

      if (!registration.pushManager) {
        console.error('Push manager not available');
        return false;
      }

      console.log('Subscribing to push notifications...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BB8V5J-QRu5aQUnOov7ah6JkBSXFJjYkYElqFdND58bgNZMQQ8nJLQ6Vl8KdAEbaiO6HeU9hsGkMMsXZwotlTOU' // Your VAPID public key
        )
      });
      console.log('Push subscription created:', subscription);

      // Save subscription to database
      console.log('Saving subscription to database...');
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Push subscription saved successfully');
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