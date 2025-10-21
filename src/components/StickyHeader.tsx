import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StickyHeaderProps {
  title: string;
  showBackButton?: boolean;
  backPath?: string;
  rightElement?: React.ReactNode;
  threshold?: number;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  title,
  showBackButton = false,
  backPath,
  rightElement,
  threshold = 100
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const handleBackClick = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ maxWidth: '448px', margin: '0 auto' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        {rightElement && (
          <div className="flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyHeader;