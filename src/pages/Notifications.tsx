import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, RefreshCw, Star, AlertTriangle, Check, Clock, Bell, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';

interface NotificationItem {
  id: string;
  type: 'payment' | 'trade' | 'rating' | 'security' | 'system';
  title: string;
  description: string;
  time: string;
  status: string;
  statusColor: string;
  icon: string;
  iconBg: string;
  isRead: boolean;
  actionUrl?: string;
  tradeId?: string;
  priority: 'low' | 'medium' | 'high';
}

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const { user } = useAuth();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Redirect premium users to premium notifications
  React.useEffect(() => {
    if (user && isPremium) {
      navigate('/premium-notifications');
    }
  }, [user, isPremium, navigate]);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className="w-5 h-5" />;
      case 'refresh-cw':
        return <RefreshCw className="w-5 h-5" />;
      case 'star':
        return <Star className="w-5 h-5" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-5 h-5" />;
      case 'bell':
        return <Bell className="w-5 h-5" />;
      default:
        return <span className="text-lg">{iconName}</span>;
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get real notifications from Supabase
        const { data: dbNotifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform Supabase data to our format
        const transformedNotifications: NotificationItem[] = (dbNotifications || []).map((notif: any) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          description: notif.message,
          time: formatTimeAgo(new Date(notif.created_at)),
          status: getStatusFromType(notif.type),
          statusColor: getStatusColor(notif.type),
          icon: getIconFromType(notif.type),
          iconBg: getIconBgFromType(notif.type),
          isRead: notif.read,
          actionUrl: getActionUrl(notif.type, notif.data),
          tradeId: notif.data?.trade_id,
          priority: notif.data?.priority || 'medium'
        }));

        setNotifications(transformedNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);

        // Fallback to sample notifications for new users
        const initialNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'payment',
        title: 'Payment Received',
        description: 'You received $150.00 from Jane Doe.',
        time: '2 mins ago',
        status: 'Completed',
        statusColor: 'text-green-600',
        icon: 'credit-card',
        iconBg: 'bg-green-100',
        isRead: false,
        actionUrl: '/payment-status',
        priority: 'high'
      },
      {
        id: '2',
        type: 'trade',
        title: 'Crypto Trade Request',
        description: 'Pending trade request for 0.05 BTC from John Smith.',
        time: '1 hour ago',
        status: 'Pending',
        statusColor: 'text-orange-600',
        icon: 'refresh-cw',
        iconBg: 'bg-blue-100',
        isRead: false,
        actionUrl: '/trade-requests',
        tradeId: 'trade-123',
        priority: 'high'
      },
      {
        id: '3',
        type: 'trade',
        title: 'Trade Auto-Accepted',
        description: 'You automatically accepted a trade for 0.02 BTC. Action required: Send payment.',
        time: '30 mins ago',
        status: 'Action Required',
        statusColor: 'text-red-600',
        icon: 'refresh-cw',
        iconBg: 'bg-orange-100',
        isRead: false,
        actionUrl: '/payment-status',
        tradeId: 'trade-456',
        priority: 'high'
      },
      {
        id: '4',
        type: 'rating',
        title: 'New Rating',
        description: 'Alice Johnson rated you 5 stars on your last trade.',
        time: '3 hours ago',
        status: 'Completed',
        statusColor: 'text-green-600',
        icon: 'star',
        iconBg: 'bg-yellow-100',
        isRead: true,
        priority: 'medium'
      },
      {
        id: '5',
        type: 'security',
        title: 'Security Alert',
        description: 'New login detected from a different device.',
        time: '1 day ago',
        status: 'Alert',
        statusColor: 'text-red-600',
        icon: 'alert-triangle',
        iconBg: 'bg-red-100',
        isRead: true,
        actionUrl: '/security',
        priority: 'high'
      }
        ];

        setNotifications(initialNotifications);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  // Helper functions for transforming notification data
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getStatusFromType = (type: string) => {
    switch (type) {
      case 'trade_request': return 'Pending';
      case 'payment_received': return 'Completed';
      case 'security': return 'Alert';
      case 'success': return 'Completed';
      default: return 'Info';
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'trade_request': return 'text-orange-600';
      case 'payment_received': return 'text-green-600';
      case 'security': return 'text-red-600';
      case 'success': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  const getIconFromType = (type: string) => {
    switch (type) {
      case 'trade_request': return 'refresh-cw';
      case 'payment_received': return 'credit-card';
      case 'security': return 'alert-triangle';
      case 'success': return 'check-circle';
      default: return 'bell';
    }
  };

  const getIconBgFromType = (type: string) => {
    switch (type) {
      case 'trade_request': return 'bg-blue-100';
      case 'payment_received': return 'bg-green-100';
      case 'security': return 'bg-red-100';
      case 'success': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getActionUrl = (type: string, data: any) => {
    switch (type) {
      case 'trade_request': return '/premium-trade-requests';
      case 'payment_received': return '/premium-payment-status';
      case 'security': return '/premium-settings';
      default: return null;
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setShowDetailPopup(true);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update in database
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Update all unread notifications in database
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );

      toast({
        title: "All notifications marked as read",
        description: "All your notifications have been marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  };

  const handleNotificationAction = (notification: NotificationItem) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setShowDetailPopup(false);
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/home" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </h1>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check size={14} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread' ? 'All caught up! No unread notifications.' : 
               filter === 'read' ? 'No read notifications yet.' : 
               'You have no notifications at this time.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-all ${
                  !notification.isRead 
                    ? 'border-blue-200 bg-blue-50/30' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.iconBg} relative`}>
                    {renderIcon(notification.icon)}
                    {!notification.isRead && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                          {notification.priority === 'high' && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              High
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <span className={`text-xs font-medium ${notification.statusColor}`}>
                            {notification.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <ArrowRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed notification popup */}
      <Dialog open={showDetailPopup} onOpenChange={setShowDetailPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedNotification && (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedNotification.iconBg}`}>
                    {renderIcon(selectedNotification.icon)}
                  </div>
                  <span>{selectedNotification.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedNotification.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {selectedNotification.time}
                  </div>
                  <span className={`font-medium ${selectedNotification.statusColor}`}>
                    {selectedNotification.status}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {selectedNotification.actionUrl && (
                  <Button
                    onClick={() => handleNotificationAction(selectedNotification)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {selectedNotification.type === 'trade' ? 'View Trade' :
                     selectedNotification.type === 'payment' ? 'View Payment' :
                     selectedNotification.type === 'security' ? 'View Security' :
                     'View Details'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowDetailPopup(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>

              {/* Additional info for trade notifications */}
              {selectedNotification.type === 'trade' && selectedNotification.tradeId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center text-blue-800 text-sm">
                    <RefreshCw size={16} className="mr-2" />
                    <span>Trade ID: {selectedNotification.tradeId}</span>
                  </div>
                  {selectedNotification.title.includes('Auto-Accepted') && (
                    <p className="text-blue-700 text-xs mt-1">
                      This trade was automatically accepted based on your settings.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
