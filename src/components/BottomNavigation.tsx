
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowUpDown, Briefcase, Settings, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BottomNavigation = () => {
  const location = useLocation();
  const [hasNewTradeRequest, setHasNewTradeRequest] = useState(false);

  // Check for real unread notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('read', false)
          .eq('type', 'trade_request')
          .limit(1);

        setHasNewTradeRequest(notifications && notifications.length > 0);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

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
    { path: '/buy-sell', icon: ArrowUpDown, label: 'Trade', hasAlert: hasNewTradeRequest },
    { path: '/news', icon: Newspaper, label: 'Updates' },
    { path: '/my-trades', icon: Briefcase, label: 'My Trades' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

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
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
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
