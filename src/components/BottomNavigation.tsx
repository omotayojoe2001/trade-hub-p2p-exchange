
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowUpDown, Briefcase, History, Settings } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/buy-sell', icon: ArrowUpDown, label: 'Buy/Sell' },
    { path: '/my-trades', icon: Briefcase, label: 'My Trades' },
    { path: '/trade-history', icon: History, label: 'Transactions' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center transition-colors py-1 ${
              location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon className="w-4 h-4 mb-2" />
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
