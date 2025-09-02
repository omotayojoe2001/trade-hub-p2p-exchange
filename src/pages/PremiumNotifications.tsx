import React, { useState, useEffect } from 'react';
import { Crown, Bell, Check, Clock, ArrowRight, Star, Zap, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

interface PremiumNotification {
  id: string;
  type: 'premium_trade' | 'cash_delivery' | 'premium_support' | 'exclusive_offer';
  title: string;
  description: string;
  time: string;
  status: string;
  statusColor: string;
  icon: string;
  iconBg: string;
  isRead: boolean;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  isPremium: boolean;
}

const PremiumNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<PremiumNotification | null>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [notifications, setNotifications] = useState<PremiumNotification[]>([]);

  useEffect(() => {
    const premiumNotifications: PremiumNotification[] = [
      {
        id: '1',
        type: 'premium_trade',
        title: 'Premium Trade Matched!',
        description: 'Your premium trade for 0.05 BTC was matched in 8 seconds. Payment required.',
        time: '2 mins ago',
        status: 'Action Required',
        statusColor: 'text-yellow-600',
        icon: 'zap',
        iconBg: 'bg-yellow-100',
        isRead: false,
        actionUrl: '/premium-payment-status',
        priority: 'high',
        isPremium: true
      },
      {
        id: '2',
        type: 'cash_delivery',
        title: 'Cash Delivery En Route',
        description: 'Your ₦50,000 cash delivery is 15 minutes away. Agent: John (+234-xxx-xxxx)',
        time: '10 mins ago',
        status: 'In Transit',
        statusColor: 'text-blue-600',
        icon: 'truck',
        iconBg: 'bg-blue-100',
        isRead: false,
        actionUrl: '/delivery-tracking',
        priority: 'high',
        isPremium: true
      },
      {
        id: '3',
        type: 'exclusive_offer',
        title: 'Exclusive Premium Rate',
        description: 'Special rate available: 1 USD = ₦1,545 (5% better than market). Limited time!',
        time: '1 hour ago',
        status: 'Limited Time',
        statusColor: 'text-purple-600',
        icon: 'star',
        iconBg: 'bg-purple-100',
        isRead: false,
        actionUrl: '/currency-conversion',
        priority: 'medium',
        isPremium: true
      },
      {
        id: '4',
        type: 'premium_support',
        title: 'Premium Support Response',
        description: 'Your support ticket #PS-001 has been resolved. Response time: 45 seconds.',
        time: '3 hours ago',
        status: 'Resolved',
        statusColor: 'text-green-600',
        icon: 'check',
        iconBg: 'bg-green-100',
        isRead: true,
        priority: 'low',
        isPremium: true
      }
    ];
    
    setNotifications(premiumNotifications);
  }, []);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap': return <Zap className="w-5 h-5" />;
      case 'truck': return <Truck className="w-5 h-5" />;
      case 'star': return <Star className="w-5 h-5" />;
      case 'check': return <Check className="w-5 h-5" />;
      case 'dollar': return <DollarSign className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const handleNotificationClick = (notification: PremiumNotification) => {
    setSelectedNotification(notification);
    setShowDetailPopup(true);
    
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    
    toast({
      title: "All notifications marked as read",
      description: "All your premium notifications have been marked as read",
    });
  };

  const handleNotificationAction = (notification: PremiumNotification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setShowDetailPopup(false);
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.isRead);
      case 'read': return notifications.filter(n => n.isRead);
      default: return notifications;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Crown size={24} className="mr-2" />
              Premium Alerts
            </h1>
            <p className="text-yellow-100 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread premium notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-xs font-bold">PREMIUM</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Premium Benefits */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <h3 className="font-bold text-yellow-900 mb-3">Premium Notification Benefits</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Zap size={20} className="text-yellow-600 mx-auto mb-1" />
              <div className="text-xs text-yellow-700">Instant Alerts</div>
            </div>
            <div className="text-center">
              <Star size={20} className="text-yellow-600 mx-auto mb-1" />
              <div className="text-xs text-yellow-700">Priority Updates</div>
            </div>
            <div className="text-center">
              <Crown size={20} className="text-yellow-600 mx-auto mb-1" />
              <div className="text-xs text-yellow-700">Exclusive Offers</div>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === tab.key
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <Check size={14} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                !notification.isRead 
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.iconBg} relative`}>
                  {renderIcon(notification.icon)}
                  {!notification.isRead && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
                  )}
                  <Crown size={10} className="absolute -bottom-1 -right-1 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-yellow-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {notification.priority === 'high' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between">
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
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      )}
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell size={48} className="text-yellow-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-900 mb-2">No notifications</h3>
            <p className="text-yellow-700">
              {filter === 'unread' ? 'All caught up! No unread notifications.' : 
               filter === 'read' ? 'No read notifications yet.' : 
               'You have no premium notifications at this time.'}
            </p>
          </div>
        )}
      </div>

      {/* Detailed notification popup */}
      <Dialog open={showDetailPopup} onOpenChange={setShowDetailPopup}>
        <DialogContent className="max-w-md bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedNotification && (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedNotification.iconBg} relative`}>
                    {renderIcon(selectedNotification.icon)}
                    <Crown size={10} className="absolute -top-1 -right-1 text-yellow-600" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-900">{selectedNotification.title}</span>
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center">
                      <Crown size={8} className="mr-1" />
                      PREMIUM
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <p className="text-yellow-800 text-sm leading-relaxed">
                  {selectedNotification.description}
                </p>
                <div className="flex items-center justify-between text-xs text-yellow-600 mt-3">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {selectedNotification.time}
                  </div>
                  <span className={`font-medium ${selectedNotification.statusColor}`}>
                    {selectedNotification.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {selectedNotification.actionUrl && (
                  <Button
                    onClick={() => handleNotificationAction(selectedNotification)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                  >
                    <Crown size={14} className="mr-2" />
                    Take Action
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowDetailPopup(false)}
                  className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumNotifications;
