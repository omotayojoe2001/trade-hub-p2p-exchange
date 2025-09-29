import { supabase } from '@/integrations/supabase/client';

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (this.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }

  async createMessageNotification(
    recipientId: string,
    senderName: string,
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Create in-app notification
      await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'new_message',
          title: `New message from ${senderName}`,
          message: messageContent.length > 50 ? 
            messageContent.substring(0, 50) + '...' : 
            messageContent,
          data: {
            conversation_id: conversationId,
            sender_name: senderName
          }
        });

      // Show browser notification if user is not on the messages page
      if (document.hidden || !window.location.pathname.includes('/inbox')) {
        this.showNotification(`New message from ${senderName}`, {
          body: messageContent.length > 100 ? 
            messageContent.substring(0, 100) + '...' : 
            messageContent,
          tag: `message-${conversationId}`,
          requireInteraction: false
        });
      }
    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();