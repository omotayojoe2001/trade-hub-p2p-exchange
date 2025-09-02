import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Home, Briefcase, Settings, Bell, MessageCircle, TrendingUp } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';

const PremiumBottomNavigation = () => {
  const location = useLocation();
  const { isPremium } = usePremium();
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false);

  // Check for active codes or trade requests
  useEffect(() => {
    const checkForAlerts = () => {
      // Check for active trade codes
      const activeCode = localStorage.getItem('activeTradeCode');
      if (activeCode) {
        try {
          const codeData = JSON.parse(activeCode);
          if (codeData.status !== 'completed') {
            setHasActiveAlerts(true);
            return;
          }
        } catch (error) {
          console.error('Error parsing active code:', error);
        }
      }

      // Check for new trade requests (mock for now)
      const lastChecked = localStorage.getItem('lastTradeRequestCheck');
      const now = Date.now();
      if (!lastChecked || now - parseInt(lastChecked) > 300000) { // 5 minutes
        setHasActiveAlerts(true);
      } else {
        setHasActiveAlerts(false);
      }
    };

    checkForAlerts();

    // Listen for new trade codes
    const handleNewTradeCode = () => checkForAlerts();
    window.addEventListener('newTradeCode', handleNewTradeCode);

    // Check periodically
    const interval = setInterval(checkForAlerts, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('newTradeCode', handleNewTradeCode);
      clearInterval(interval);
    };
  }, []);

  // Don't show premium navigation if user is not premium
  if (!isPremium) {
    return null;
  }

  const navItems = [
    { path: '/premium-dashboard', icon: Home, label: 'Home' },
    { path: '/premium-trade', icon: TrendingUp, label: 'Trade', hasAlert: hasActiveAlerts },
    { path: '/premium-messages', icon: MessageCircle, label: 'Messages' },
    { path: '/premium-notifications', icon: Bell, label: 'Alerts' },
    { path: '/premium-trades', icon: Briefcase, label: 'My Trades' },
    { path: '/premium-settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-50 to-amber-50 border-t-2 border-yellow-200 px-1 py-2 z-50">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center transition-colors py-1 px-1 rounded-lg flex-1 ${
              location.pathname === item.path
                ? 'text-yellow-700 bg-yellow-100'
                : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            {location.pathname === item.path && (
              <span className="absolute -top-1 -right-1 text-yellow-500">
                <Crown size={8} />
              </span>
            )}
            {item.hasAlert && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white"></span>
            )}
            <item.icon className="w-4 h-4 mb-1" />
            <span className={`text-xs ${location.pathname === item.path ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Premium indicator */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
          <Crown size={12} className="mr-1" />
          PREMIUM
        </div>
      </div>
    </div>
  );
};

export default PremiumBottomNavigation;
