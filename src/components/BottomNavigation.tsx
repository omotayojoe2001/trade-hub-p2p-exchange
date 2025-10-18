
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowUpDown, Briefcase, Settings, Newspaper, MessageCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messagingService';


const BottomNavigation = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [hasNewTradeRequest, setHasNewTradeRequest] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMerchant, setIsMerchant] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeTrades, setActiveTrades] = useState(0);

  // Check merchant status and notifications
  useEffect(() => {
    const checkMerchantStatus = async () => {
      if (profile) {
        // Ensure consistent merchant status
        setIsMerchant(Boolean(profile.is_merchant));
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

    const checkUnreadMessages = async () => {
      try {
        if (!user) return;
        
        const { data: conversations } = await messagingService.getConversations();
        const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Error checking messages:', error);
        setUnreadMessages(0);
      }
    };

    const checkActiveTrades = async () => {
      try {
        if (!user) return;
        
        const { data: trades } = await supabase
          .from('trades')
          .select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .in('status', ['pending', 'in_progress', 'payment_proof_uploaded']);
        
        const { data: cashTrades } = await supabase
          .from('cash_trades')
          .select('id')
          .eq('seller_id', user.id)
          .in('status', ['vendor_paid', 'payment_confirmed', 'delivery_in_progress']);
        
        const totalActive = (trades?.length || 0) + (cashTrades?.length || 0);
        setActiveTrades(totalActive);
      } catch (error) {
        console.error('Error checking active trades:', error);
        setActiveTrades(0);
      }
    };

    checkMerchantStatus();
    checkNotifications();
    checkUnreadMessages();
    checkActiveTrades();

    // Set up real-time subscriptions
    const notificationChannel = supabase
      .channel('notification-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => checkNotifications()
      )
      .subscribe();

    const messageSubscription = messagingService.subscribeToConversations(user?.id || '', () => {
      checkUnreadMessages();
    });

    const tradeChannel = supabase
      .channel('trade-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'trades' },
        () => checkActiveTrades()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cash_trades' },
        () => checkActiveTrades()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(tradeChannel);
      messageSubscription?.unsubscribe();
    };
  }, []);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/my-orders', icon: Package, label: 'Orders' },
    { path: '/buy-sell', icon: ArrowUpDown, label: 'Trade' },
    { path: '/my-trades', icon: Briefcase, label: 'Trades' },
    { path: '/inbox', icon: MessageCircle, label: 'Inbox' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];



  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 z-[9999] shadow-lg transform-none will-change-auto" style={{ position: 'fixed', transform: 'none' }}>
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          let badgeCount = 0;
          
          if (item.path === '/my-trades') {
            badgeCount = activeTrades;
          } else if (item.path === '/inbox') {
            badgeCount = unreadMessages;
          } else if (item.path === '/buy-sell' && profile?.is_merchant) {
            badgeCount = notificationCount;
          }
          
          const showBadge = badgeCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive 
                  ? 'text-primary bg-primary/10 scale-105' 
                  : 'text-muted-foreground hover:text-primary hover:bg-accent/50 hover:scale-105'
              }`}
              onClick={() => {
                if (item.path === '/buy-sell' && hasNewTradeRequest) {
                  setHasNewTradeRequest(false);
                }
              }}
            >
              <div className="relative">
                <item.icon className={`transition-all duration-200 ${isActive ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {showBadge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-[10px] text-destructive-foreground font-bold">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
