import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton rounded-lg bg-gray-200 animate-pulse ${className}`}
        />
      ))}
    </>
  );
};

interface NativeSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const NativeSpinner: React.FC<NativeSpinnerProps> = ({ 
  size = 'md', 
  color = '#3b82f6' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={`native-spinner ${sizeClasses[size]}`}
      style={{ borderTopColor: color }}
    />
  );
};

interface LoadingCardProps {
  title?: boolean;
  lines?: number;
  avatar?: boolean;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title = true, 
  lines = 3, 
  avatar = false 
}) => {
  return (
    <div className="native-card p-4 space-y-3">
      <div className="flex items-center space-x-3">
        {avatar && <Skeleton className="w-10 h-10 rounded-full" />}
        {title && <Skeleton className="h-4 w-32" />}
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton 
            key={index} 
            className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} 
          />
        ))}
      </div>
    </div>
  );
};

interface LoadingListProps {
  count?: number;
}

export const LoadingList: React.FC<LoadingListProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} avatar lines={2} />
      ))}
    </div>
  );
};

interface PullRefreshIndicatorProps {
  isRefreshing: boolean;
  progress: number;
}

export const PullRefreshIndicator: React.FC<PullRefreshIndicatorProps> = ({ 
  isRefreshing, 
  progress 
}) => {
  return (
    <div className="pull-refresh-indicator">
      <div className={`transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`}>
        <NativeSpinner size="sm" />
      </div>
      <span className="text-sm text-gray-600 mt-2">
        {isRefreshing ? 'Refreshing...' : progress > 0.8 ? 'Release to refresh' : 'Pull to refresh'}
      </span>
    </div>
  );
};