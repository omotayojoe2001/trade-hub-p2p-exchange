
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowUpDown, Briefcase, Settings, Newspaper, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [hasNewTradeRequest, setHasNewTradeRequest] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMerchant, setIsMerchant] = useState(false);

  // Check merchant status and notifications
  useEffect(() => {
    const checkMerchantStatus = async () => {
      if (profile) {
        setIsMerchant(profile.is_merchant || false);
      }
    };

    const checkNotifications = async () => {
      try {
        if (!user) return;

        // Check for trade request notifications for merchants
        if (profile?.is_merchant) {
          const { data: tradeRequests } = await supabase
            .from('trade_requests')
            .select('id')
            .eq('status', 'open');

          const count = tradeRequests?.length || 0;
          setHasNewTradeRequest(count > 0);
          setNotificationCount(count);
        } else {
          // Check for regular notifications for customers
          const { data: notifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('read', false);

          const count = notifications?.length || 0;
          setHasNewTradeRequest(count > 0);
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
        setHasNewTradeRequest(false);
        setNotificationCount(0);
      }
    };

    checkMerchantStatus();
    checkNotifications();

    checkNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notification-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => checkNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/buy-sell', icon: ArrowUpDown, label: 'Trade' },
    { path: '/news', icon: Newspaper, label: 'Updates' },
    { path: '/my-trades', icon: Briefcase, label: 'My Trades' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  // Add merchant-specific items if user is a merchant
  if (isMerchant) {
    navItems.splice(4, 0, {
      path: '/merchant-trade-requests',
      icon: Bell,
      label: 'Requests',
      hasAlert: hasNewTradeRequest,
      alertCount: notificationCount
    });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center transition-colors py-1 relative ${
              location.pathname === item.path ? 'text-brand' : 'text-foreground/40 hover:text-foreground'
            }`}
            onClick={() => {
              if (item.path === '/buy-sell' && hasNewTradeRequest) {
                setHasNewTradeRequest(false);
              }
            }}
          >
            <div className="relative">
              <item.icon className="w-4 h-4 mb-2" />
              {item.hasAlert && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  {item.alertCount && item.alertCount > 0 && (
                    <span className="text-white text-xs font-bold leading-none">
                      {item.alertCount > 9 ? '9+' : item.alertCount}
                    </span>
                  )}
                  {(!item.alertCount || item.alertCount === 0) && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              )}
            </div>
            <span className={`text-xs ${
              location.pathname === item.path ? 'font-medium' : ''
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
