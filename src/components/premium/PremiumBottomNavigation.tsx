import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Home, DollarSign, Briefcase, Settings } from 'lucide-react';

const PremiumBottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/premium-dashboard', icon: Home, label: 'Premium' },
    { path: '/premium/sell', icon: DollarSign, label: 'Sell Cash' },
    { path: '/my-trades', icon: Briefcase, label: 'Trades' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center transition-colors py-1 ${
              location.pathname === item.path ? 'text-brand' : 'text-foreground/40 hover:text-foreground'
            }`}
          >
            {location.pathname === item.path && (
              <span className="absolute -top-3 right-2 text-yellow-500"><Crown size={12} /></span>
            )}
            <item.icon className="w-4 h-4 mb-2" />
            <span className={`text-xs ${location.pathname === item.path ? 'font-medium' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PremiumBottomNavigation;
