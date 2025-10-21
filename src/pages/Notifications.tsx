import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCircle, DollarSign, Shield, AlertTriangle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';
import StickyHeader from '@/components/StickyHeader';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'trade_request' | 'payment_received' | 'system' | 'security' | 'premium';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const transformedNotifications = (dbNotifications || []).map((notif: any) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.created_at),
          read: notif.read,
          priority: notif.data?.priority || 'medium',
          data: notif.data
        }));

        setNotifications(transformedNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
        // Fallback to empty array
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade_request':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'security':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-gray-600" />;
      case 'premium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  // Filter notifications based on selected filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Type filter
      if (typeFilter !== 'all' && notification.type !== typeFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'unread' && notification.read) {
        return false;
      }
      if (statusFilter === 'read' && !notification.read) {
        return false;
      }
      
      // Priority filter
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) {
        return false;
      }
      
      return true;
    });
  }, [notifications, typeFilter, statusFilter, priorityFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <StickyHeader 
        title="Notifications" 
        rightElement={
          unreadCount > 0 ? (
            <Button 
              onClick={markAllAsRead}
              variant="outline" 
              size="sm"
            >
              Mark all read
            </Button>
          ) : null
        }
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600">
              {filteredNotifications.length} of {totalCount} notifications
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              variant="outline" 
              size="sm"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-white">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="trade_request">Trade Requests</SelectItem>
              <SelectItem value="payment_received">Payments</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredNotifications.length === 0 ? (
          notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
            </CardContent>
          </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching notifications</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more results.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-all ${
                !notification.read ? 'border-blue-200 bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(notification.priority)}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${
                      !notification.read ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(notification.timestamp)} ago
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Notifications;