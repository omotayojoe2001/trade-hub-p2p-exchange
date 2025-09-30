import { supabase } from '@/integrations/supabase/client';

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private shownNotifications = new Set<string>();
  
  constructor() {
    console.log('🔔 NotificationService initialized');
    // Log current state every 30 seconds for debugging
    setInterval(() => {
      console.log(`🔔 [DEBUG] NotificationService state:`);
      console.log(`   Permission: ${this.permission}`);
      console.log(`   Active notifications: ${this.shownNotifications.size}`);
      console.log(`   Active list:`, Array.from(this.shownNotifications));
    }, 30000);
  }

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
    const timestamp = new Date().toISOString();
    const notificationId = options?.tag || `${title}-${options?.body || ''}-${Date.now()}`;
    
    console.log(`🔔 [${timestamp}] Browser notification request:`);
    console.log(`   📋 Title: ${title}`);
    console.log(`   📝 Body: ${options?.body || 'No body'}`);
    console.log(`   🏷️  Tag: ${options?.tag || 'No tag'}`);
    console.log(`   🆔 Generated ID: ${notificationId}`);
    console.log(`   ✅ Permission: ${this.permission}`);
    console.log(`   📊 Currently shown: ${this.shownNotifications.size}`);
    console.log(`   🔍 Shown notifications:`, Array.from(this.shownNotifications));
    
    if (this.permission === 'granted') {
      // Check for duplicates
      if (this.shownNotifications.has(notificationId)) {
        console.log(`   🚫 Duplicate notification blocked: ${notificationId}`);
        return;
      }
      
      this.shownNotifications.add(notificationId);
      console.log(`   ➕ Added to shown notifications: ${notificationId}`);
      
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      
      console.log(`   ✅ Browser notification created successfully`);
      
      // Clean up after 5 seconds
      setTimeout(() => {
        this.shownNotifications.delete(notificationId);
        console.log(`   🗑️  Cleaned up notification: ${notificationId}`);
      }, 5000);
    } else {
      console.log(`   ❌ Cannot show notification - permission not granted: ${this.permission}`);
    }
  }

  async createMessageNotification(
    recipientId: string,
    senderName: string,
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    const debugId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`🔔 [${timestamp}] DEBUG-${debugId}: Creating message notification`);
    console.log(`   📧 Recipient: ${recipientId}`);
    console.log(`   👤 Sender: ${senderName}`);
    console.log(`   💬 Message: ${messageContent.substring(0, 50)}...`);
    console.log(`   🗨️  Conversation: ${conversationId}`);
    console.log(`   📍 Current path: ${window.location.pathname}`);
    console.log(`   👁️  Document hidden: ${document.hidden}`);
    
    try {
      // Check if notification already exists for this conversation recently
      const { data: recentNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', recipientId)
        .eq('type', 'new_message')
        .gte('created_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
        .order('created_at', { ascending: false });
      
      console.log(`   🔍 Recent notifications (last 30s): ${recentNotifications?.length || 0}`);
      
      if (recentNotifications && recentNotifications.length > 0) {
        const recentFromSameConv = recentNotifications.filter(n => 
          n.data?.conversation_id === conversationId
        );
        console.log(`   ⚠️  Recent from same conversation: ${recentFromSameConv.length}`);
        
        if (recentFromSameConv.length > 0) {
          console.log(`   🚫 Skipping notification - recent notification exists for conversation ${conversationId}`);
          return;
        }
      }
      
      // Create in-app notification
      const { data: notification, error } = await supabase
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
            sender_name: senderName,
            debug_id: debugId
          }
        })
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Database notification error:`, error);
        throw error;
      }
      
      console.log(`   ✅ Database notification created: ${notification.id}`);

      // Show browser notification if user is not on the messages page
      const shouldShowBrowser = document.hidden || !window.location.pathname.includes('/inbox');
      console.log(`   🌐 Should show browser notification: ${shouldShowBrowser}`);
      
      if (shouldShowBrowser) {
        const notificationId = `message-${conversationId}-${Date.now()}`;
        console.log(`   📱 Creating browser notification: ${notificationId}`);
        
        this.showNotification(`New message from ${senderName}`, {
          body: messageContent.length > 100 ? 
            messageContent.substring(0, 100) + '...' : 
            messageContent,
          tag: notificationId,
          requireInteraction: false
        });
      }
      
      console.log(`   ✅ Message notification process completed for DEBUG-${debugId}`);
    } catch (error) {
      console.error(`   ❌ Error in createMessageNotification DEBUG-${debugId}:`, error);
    }
  }
}

export const notificationService = NotificationService.getInstance();