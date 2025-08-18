
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowUpDown, Briefcase, Settings, Newspaper } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const [hasNewTradeRequest, setHasNewTradeRequest] = useState(false);

  // Mock new trade request notification
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasNewTradeRequest(true);
    }, 5000); // Show notification after 5 seconds
    
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/buy-sell', icon: ArrowUpDown, label: 'Buy/Sell', hasAlert: hasNewTradeRequest },
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
