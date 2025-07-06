
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/buy-sell', icon: '🔄', label: 'Buy/Sell' },
    { path: '/my-trades', icon: '💼', label: 'My Trades' },
    { path: '/trade-history', icon: '📋', label: 'Transactions' },
    { path: '/settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center transition-colors ${
              location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="w-6 h-6 mb-1">{item.icon}</div>
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
