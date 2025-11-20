import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useNativeGestures } from '@/hooks/useNativeGestures';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  enabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  enabled = true
}) => {
  const { isRefreshing, pullDistance } = useNativeGestures({
    onPullToRefresh: onRefresh,
    enablePullToRefresh: enabled
  });

  const refreshThreshold = 60;
  const maxPull = 100;
  const progress = Math.min(pullDistance / refreshThreshold, 1);
  const rotation = progress * 180;

  return (
    <div className="relative">
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-blue-50 to-transparent transition-all duration-200 z-10"
          style={{ 
            height: `${Math.min(pullDistance, maxPull)}px`,
            transform: `translateY(-${Math.max(0, maxPull - pullDistance)}px)`
          }}
        >
          <div className="flex flex-col items-center space-y-2 py-4">
            <RefreshCw 
              className={`w-6 h-6 text-blue-500 transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <span className="text-sm text-blue-600 font-medium">
              {isRefreshing ? 'Refreshing...' : 
               pullDistance > refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${Math.min(pullDistance * 0.3, 30)}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
};