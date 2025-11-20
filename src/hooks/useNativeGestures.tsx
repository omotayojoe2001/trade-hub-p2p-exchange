import { useEffect, useRef, useState } from 'react';

interface UseNativeGesturesProps {
  onPullToRefresh?: () => Promise<void>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  enablePullToRefresh?: boolean;
  enableSwipeGestures?: boolean;
  enableLongPress?: boolean;
}

export const useNativeGestures = ({
  onPullToRefresh,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  enablePullToRefresh = false,
  enableSwipeGestures = false,
  enableLongPress = false
}: UseNativeGesturesProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press timer
    if (enableLongPress && onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        navigator.vibrate?.(50);
        onLongPress();
      }, 500);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Pull to refresh
    if (enablePullToRefresh && deltaY > 0 && window.scrollY === 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, 100);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async (e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Pull to refresh
    if (enablePullToRefresh && pullDistance > 60 && onPullToRefresh) {
      setIsRefreshing(true);
      navigator.vibrate?.(100);
      try {
        await onPullToRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    // Swipe gestures
    if (enableSwipeGestures && deltaTime < 300 && Math.abs(deltaY) < 100) {
      if (deltaX > 100 && onSwipeRight) {
        navigator.vibrate?.(50);
        onSwipeRight();
      } else if (deltaX < -100 && onSwipeLeft) {
        navigator.vibrate?.(50);
        onSwipeLeft();
      }
    }

    touchStartRef.current = null;
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [enablePullToRefresh, enableSwipeGestures, enableLongPress, onPullToRefresh, onSwipeLeft, onSwipeRight, onLongPress]);

  return {
    isRefreshing,
    pullDistance,
    gestures: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};