import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, MessageCircle, User, Settings, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const VendorBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [jobsCount, setJobsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;

      try {
        // Get active cash delivery jobs count
        const vendorId = localStorage.getItem('vendor_id');
        const { data: jobs } = await supabase
          .from('cash_trades')
          .select('id')
          .eq('vendor_id', vendorId)
          .eq('status', 'vendor_paid');

        // Get unread messages count (mock for now)
        const messages: any[] = [];

        setJobsCount(jobs?.length || 0);
        setMessagesCount(messages?.length || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();

    // Set up real-time subscription
    const channel = supabase
      .channel('vendor-updates')
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
      id: 'jobs',
      label: 'Jobs',
      icon: Package,
      path: '/vendor/dashboard',
      badge: jobsCount
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Bell,
      path: '/vendor/transactions',
      badge: 0
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
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg min-w-[70px] ${
                active 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VendorBottomNavigation;
