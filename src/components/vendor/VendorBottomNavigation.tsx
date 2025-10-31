import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Truck, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const VendorBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;

      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (vendor) {
          const { data: jobs } = await supabase
            .from('cash_trades')
            .select('id')
            .eq('vendor_id', vendor.id)
            .in('status', ['vendor_paid', 'payment_confirmed']);

          setActiveJobs(jobs?.length || 0);
        }

        setMessagesCount(0);
      } catch (error) {
        console.error('Error fetching vendor counts:', error);
      }
    };

    fetchCounts();

    const channel = supabase
      .channel('vendor-nav-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cash_trades' },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/vendor/dashboard',
      badge: 0
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: Truck,
      path: '/vendor/transactions',
      badge: activeJobs
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      path: '/vendor/messages',
      badge: messagesCount
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/vendor/profile',
      badge: 0
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/vendor/dashboard' && location.pathname.startsWith('/vendor/dashboard'));
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        borderTop: '1px solid #374151',
        zIndex: 9999,
        width: '100vw',
        height: '75px'
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 12px',
          width: '100%',
          height: '100%'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                flex: 1,
                maxWidth: '80px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                backgroundColor: 'transparent',
                outline: 'none',
                transform: active ? 'translateY(-2px)' : 'none'
              }}
            >
              <div 
                style={{
                  position: 'relative',
                  marginBottom: '4px'
                }}
              >
                <Icon 
                  style={{
                    width: active ? '26px' : '22px',
                    height: active ? '26px' : '22px',
                    color: active ? '#ffffff' : '#9ca3af',
                    transition: 'all 0.3s ease'
                  }}
                />
                {item.badge > 0 && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      minWidth: '20px',
                      height: '20px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span 
                      style={{
                        fontSize: '11px',
                        color: '#ffffff',
                        fontWeight: 800
                      }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  </div>
                )}
              </div>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  color: active ? '#ffffff' : '#9ca3af'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { VendorBottomNavigation };
export default VendorBottomNavigation;