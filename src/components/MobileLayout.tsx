import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`mobile-safe min-h-screen bg-white ${className}`}>
      <div className="page-content w-full max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;