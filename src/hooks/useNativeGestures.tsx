import { useEffect, useRef, useState } from 'react';

interface UseNativeGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  enableSwipeGestures?: boolean;
  enableLongPress?: boolean;
}

export const useNativeGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  enableSwipeGestures = false,
  enableLongPress = false
}: UseNativeGesturesProps) => {
  // Completely disabled to prevent scroll interference
  return {
    gestures: {
      onTouchStart: () => {},
      onTouchMove: () => {},
      onTouchEnd: () => {}
    }
  };
};