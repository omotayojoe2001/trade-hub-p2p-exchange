import React from 'react';
import { useStatusBar } from '@/hooks/useStatusBar';


interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  statusBarStyle?: 'light' | 'dark';
  statusBarColor?: string;

  showHeader?: boolean;
  headerTitle?: string;
  headerActions?: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  className = '',
  statusBarStyle = 'dark',
  statusBarColor,

  showHeader = false,
  headerTitle,
  headerActions
}) => {
  useStatusBar(statusBarStyle, statusBarColor);

  const content = (
    <div className={`mobile-container min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      {showHeader && (
        <div className="native-header sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">{headerTitle}</h1>
            {headerActions}
          </div>
        </div>
      )}
      
      <div className="page-content native-scroll w-full max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );

  return content;
};

export default MobileLayout;