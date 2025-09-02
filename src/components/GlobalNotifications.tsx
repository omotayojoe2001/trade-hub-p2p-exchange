import React, { useState, useEffect } from 'react';
import { Bell, X, DollarSign, Check, AlertCircle, Shield, ArrowRight, Clock, UserCheck, CreditCard, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, realtimeService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'trade' | 'payment' | 'security' | 'premium' | 'update';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
  tradeId?: string;
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

  // Load notifications from Supabase
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        // Use mock notifications instead of Supabase for now
        const dbNotifications = [];
        
        // Transform Supabase data to our format
        const transformedNotifications = dbNotifications.map((notif: any) => ({
          id: notif.id,
          type: notif.type as any,
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.created_at),
          isRead: notif.read,
          actionRequired: notif.type === 'trade_request' || notif.type === 'security',
          tradeId: notif.trade_id,
          isPremium: notif.is_premium || notif.type === 'premium',
          priority: notif.priority || 'medium'
        }));
        
        setNotifications(transformedNotifications);
        
        // Show notification if there are unread ones
        const unreadCount = transformedNotifications.filter(n => !n.isRead).length;
        if (unreadCount > 0) {
          showNewNotification();
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = realtimeService.subscribeToNotifications(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
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
        
        setNotifications(prev => [newNotification, ...prev]);
        showNewNotification();
        
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  const showNewNotification = () => {
    setIsVisible(true);
    setTimeout(() => {
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

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailPopup(true);
    setIsVisible(false);
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
          navigate('/payment-status');
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

      // Navigate to payment flow
      navigate(`/payment-status/${tradeId}`);
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