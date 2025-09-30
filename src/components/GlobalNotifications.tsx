import React, { useState, useEffect } from 'react';
import { Bell, X, DollarSign, Check, AlertCircle, Shield, ArrowRight, Clock, UserCheck, CreditCard, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, realtimeService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'trade' | 'payment' | 'security' | 'premium' | 'update' | 'trade_request';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
  tradeId?: string;
  tradeRequestId?: string;
  isPremium?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

const GlobalNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Disable notifications for vendor users
  const isVendorUser = localStorage.getItem('vendor_id') || window.location.pathname.startsWith('/vendor');
  if (isVendorUser) {
    return null;
  }

  // Load notifications from Supabase
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;

      const timestamp = new Date().toISOString();
      console.log(`🔔 [${timestamp}] GlobalNotifications: Loading notifications for user ${user.id}`);

      try {
        // Get real notifications from Supabase
        const { data: dbNotifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        console.log(`📊 Found ${dbNotifications?.length || 0} notifications in database`);
        
        // Auto-mark old notifications as read (older than 1 minute) - ALL types
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const oldNotifications = (dbNotifications || []).filter(notif => 
          !notif.read && 
          new Date(notif.created_at) < oneMinuteAgo
        );
        
        if (oldNotifications.length > 0) {
          console.log(`🧹 Auto-marking ${oldNotifications.length} old notifications as read (older than 1 minute)`);
          
          const oldNotificationIds = oldNotifications.map(n => n.id);
          await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', oldNotificationIds);
          
          // Update the data to reflect the changes
          dbNotifications?.forEach(notif => {
            if (oldNotificationIds.includes(notif.id)) {
              notif.read = true;
            }
          });
        }
        
        // Log each notification for debugging
        (dbNotifications || []).forEach((notif, index) => {
          const ageMinutes = Math.round((Date.now() - new Date(notif.created_at).getTime()) / 1000 / 60);
          console.log(`   ${index + 1}. [${notif.type}] ${notif.title} - Read: ${notif.read} - Created: ${notif.created_at}`);
          console.log(`      🕰️ Age: ${ageMinutes} minutes ${ageMinutes > 1 ? '(AUTO-MARKED READ)' : ''}`);
          if (notif.type === 'new_message') {
            console.log(`      💬 Message notification - Conversation: ${notif.data?.conversation_id}`);
          } else if (notif.type.includes('trade')) {
            console.log(`      📈 Trade notification - Trade ID: ${notif.data?.trade_id || 'N/A'}`);
          }
        });

        // Transform Supabase data to our format
        const transformedNotifications = (dbNotifications || []).map((notif: any) => ({
          id: notif.id,
          type: notif.type as any,
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.created_at),
          isRead: notif.read,
          actionRequired: notif.type === 'trade_request' || notif.type === 'security',
          tradeId: notif.data?.trade_id,
          isPremium: notif.type === 'premium' || notif.data?.is_premium,
          priority: notif.data?.priority || 'medium'
        }));

        setNotifications(transformedNotifications);

        // Show notification only for recent unread ones (within last minute)
        const recentUnread = transformedNotifications.filter(n => 
          !n.isRead && 
          (Date.now() - n.timestamp.getTime()) < 60 * 1000 // 1 minute
        );
        const totalUnreadCount = transformedNotifications.filter(n => !n.isRead).length;
        
        console.log(`🔴 Total unread notifications: ${totalUnreadCount}`);
        console.log(`🆕 Recent unread notifications (last minute): ${recentUnread.length}`);
        
        if (recentUnread.length > 0) {
          const latestUnread = recentUnread[0];
          console.log(`🔔 Showing notification popup for recent: ${latestUnread?.title}`);
          showNewNotification();
        } else if (totalUnreadCount > 0) {
          console.log(`⏰ ${totalUnreadCount} unread notifications exist but all are older than 1 minute - not showing popup`);
        }
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
        // Create sample notification for new users
        setNotifications([{
          id: 'welcome',
          type: 'premium',
          title: 'Welcome to Central Exchange!',
          message: 'Your account is ready. Start trading crypto with confidence.',
          timestamp: new Date(),
          isRead: false,
          actionRequired: false,
          isPremium: true,
          priority: 'medium'
        }]);
      }
    };

    loadNotifications();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const timestamp = new Date().toISOString();
    console.log(`📡 [${timestamp}] GlobalNotifications: Setting up real-time subscription for user ${user.id}`);

    const subscription = realtimeService.subscribeToNotifications(user.id, (payload) => {
      const realtimeTimestamp = new Date().toISOString();
      console.log(`🔔 [${realtimeTimestamp}] Real-time notification received:`, payload.eventType);
      
      if (payload.eventType === 'INSERT') {
        console.log(`   🆕 New notification: ${payload.new.id}`);
        console.log(`   📋 Type: ${payload.new.type}`);
        console.log(`   📋 Title: ${payload.new.title}`);
        console.log(`   📖 Read: ${payload.new.read}`);
        console.log(`   🕰️ Created: ${payload.new.created_at}`);
        
        if (payload.new.type === 'new_message') {
          console.log(`   💬 Message notification details:`);
          console.log(`      Conversation: ${payload.new.data?.conversation_id}`);
          console.log(`      Sender: ${payload.new.data?.sender_name}`);
          console.log(`      Debug ID: ${payload.new.data?.debug_id}`);
        }
        
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
        
        console.log(`   ➕ Adding to notifications list`);
        setNotifications(prev => [newNotification, ...prev]);
        
        console.log(`   🔔 Showing notification popup`);
        showNewNotification();
        
        console.log(`   🍞 Showing toast notification`);
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
    });

    return () => {
      console.log(`📡 [${new Date().toISOString()}] GlobalNotifications: Unsubscribing from real-time notifications for user ${user.id}`);
      subscription.unsubscribe();
    };
  }, [user, toast]);

  const showNewNotification = () => {
    const timestamp = new Date().toISOString();
    console.log(`🔔 [${timestamp}] GlobalNotifications: Showing notification popup`);
    console.log(`   📊 Current notifications count: ${notifications.length}`);
    console.log(`   👁️ Currently visible: ${isVisible}`);
    
    setIsVisible(true);
    setTimeout(() => {
      console.log(`🔔 [${new Date().toISOString()}] GlobalNotifications: Hiding notification popup after 6 seconds`);
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

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailPopup(true);
    setIsVisible(false);

    // Navigate based on notification type
    if (notification.type === 'trade_request' && notification.tradeRequestId) {
      // Navigate to merchant trade requests
      setTimeout(() => window.location.href = '/merchant-trade-requests', 500);
    } else if (notification.tradeId) {
      // Navigate to specific trade
      setTimeout(() => window.location.href = `/trade-details/${notification.tradeId}`, 500);
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id);

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleNotificationAction = async (notification: Notification, action: string) => {
    try {
      // Mark as read
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );

      // Handle different actions based on notification type
      switch (action) {
        case 'view_trade':
          if (notification.tradeId) {
            navigate(`/trade-details/${notification.tradeId}`);
          }
          break;
        case 'view_trade_requests':
          navigate('/trade-requests');
          break;
        case 'view_payment':
          navigate('/my-trades');
          break;
        case 'view_security':
          navigate('/security');
          break;
        case 'view_premium':
          navigate('/premium');
          break;
        case 'accept_trade':
          // Auto-accept trade logic
          await handleAutoAcceptTrade(notification.tradeId);
          break;
        default:
          break;
      }

      setShowDetailPopup(false);
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const handleAutoAcceptTrade = async (tradeId?: string) => {
    if (!tradeId) return;

    try {
      // Simulate auto-accept trade
      toast({
        title: "Trade Accepted",
        description: "You have automatically accepted the trade. Please send payment.",
      });

      // Navigate to trade details
      navigate(`/trade-details/${tradeId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept trade automatically",
        variant: "destructive"
      });
    }
  };

  const getNotificationActions = (notification: Notification) => {
    switch (notification.type) {
      case 'trade':
        return [
          { label: 'View Trade', action: 'view_trade', primary: true },
          { label: 'Accept Trade', action: 'accept_trade', primary: false }
        ];
      case 'payment':
        return [
          { label: 'View Payment', action: 'view_payment', primary: true }
        ];
      case 'security':
        return [
          { label: 'View Security', action: 'view_security', primary: true }
        ];
      case 'premium':
        return [
          { label: 'View Premium', action: 'view_premium', primary: true }
        ];
      default:
        return [
          { label: 'View Details', action: 'view_trade_requests', primary: true }
        ];
    }
  };

  const latestNotification = notifications.find(n => !n.isRead);

  return (
    <>
      {/* Floating notification popup */}
      {isVisible && latestNotification && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 rounded-xl shadow-lg border p-4 animate-in slide-in-from-top-2 cursor-pointer hover:shadow-xl transition-shadow ${
            latestNotification.isPremium
              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
              : 'bg-white border-gray-100'
          }`}
          onClick={() => handleNotificationClick(latestNotification)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                latestNotification.isPremium ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {getNotificationIcon(latestNotification.type)}
                {latestNotification.isPremium && (
                  <Crown size={10} className="absolute -top-1 -right-1 text-yellow-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={`font-semibold text-sm ${
                    latestNotification.isPremium ? 'text-yellow-900' : 'text-gray-900'
                  }`}>
                    {latestNotification.title}
                  </h4>
                  {latestNotification.isPremium && (
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center">
                      <Crown size={8} className="mr-1" />
                      PREMIUM
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-1 line-clamp-2 ${
                  latestNotification.isPremium ? 'text-yellow-800' : 'text-gray-600'
                }`}>
                  {latestNotification.message}
                </p>
                <p className={`text-xs mt-1 flex items-center ${
                  latestNotification.isPremium ? 'text-yellow-700' : 'text-blue-600'
                }`}>
                  Tap to view details <ArrowRight size={12} className="ml-1" />
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className={`ml-2 ${
                latestNotification.isPremium
                  ? 'text-yellow-600 hover:text-yellow-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detailed notification popup */}
      <Dialog open={showDetailPopup} onOpenChange={setShowDetailPopup}>
        <DialogContent className={`max-w-md ${
          selectedNotification?.isPremium
            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
            : ''
        }`}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedNotification && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                  selectedNotification.isPremium ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {getNotificationIcon(selectedNotification.type)}
                  {selectedNotification.isPremium && (
                    <Crown size={10} className="absolute -top-1 -right-1 text-yellow-600" />
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className={selectedNotification?.isPremium ? 'text-yellow-900' : ''}>
                  {selectedNotification?.title}
                </span>
                {selectedNotification?.isPremium && (
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center">
                    <Crown size={8} className="mr-1" />
                    PREMIUM
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedNotification.message}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Clock size={12} className="mr-1" />
                  {selectedNotification.timestamp.toLocaleString()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {getNotificationActions(selectedNotification).map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => handleNotificationAction(selectedNotification, action.action)}
                    className={`w-full ${action.primary
                      ? selectedNotification.isPremium
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      : selectedNotification.isPremium
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedNotification.isPremium && action.primary && (
                      <Crown size={14} className="mr-2" />
                    )}
                    {action.label}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setShowDetailPopup(false)}
                  className={`w-full ${
                    selectedNotification.isPremium
                      ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                      : ''
                  }`}
                >
                  Close
                </Button>
              </div>

              {/* Additional info for trade notifications */}
              {selectedNotification.type === 'trade' && selectedNotification.tradeId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center text-blue-800 text-sm">
                    <UserCheck size={16} className="mr-2" />
                    <span>Trade ID: {selectedNotification.tradeId}</span>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    Auto-accepting will immediately start the payment process.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalNotifications;