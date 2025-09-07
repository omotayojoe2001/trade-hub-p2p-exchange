import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, MessageCircle, User, Settings, Bell } from 'lucide-react';

const VendorBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Package,
      path: '/vendor/dashboard',
      badge: 0
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      path: '/vendor/messages',
      badge: 0
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                active 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>
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
