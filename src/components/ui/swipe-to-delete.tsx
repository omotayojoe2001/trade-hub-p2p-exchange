import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  deleteText?: string;
  threshold?: number;
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  onDelete,
  children,
  deleteText = 'Delete',
  threshold = 100
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const { impact, notification } = useHapticFeedback();

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startXRef.current;
    
    if (deltaX < 0) {
      const newSwipeX = Math.max(deltaX, -threshold * 1.5);
      setSwipeX(newSwipeX);
      
      // Haptic feedback at threshold
      if (Math.abs(newSwipeX) >= threshold && Math.abs(swipeX) < threshold) {
        impact('medium');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (Math.abs(swipeX) >= threshold) {
      setIsDeleting(true);
      await notification('warning');
      setTimeout(() => {
        onDelete();
        setIsDeleting(false);
        setSwipeX(0);
      }, 200);
    } else {
      setSwipeX(0);
    }
  };

  const progress = Math.min(Math.abs(swipeX) / threshold, 1);

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Delete background */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-white transition-all duration-200"
        style={{ 
          width: `${Math.abs(swipeX)}px`,
          opacity: progress
        }}
      >
        <div className="flex items-center space-x-2 px-4">
          <Trash2 className="w-5 h-5" />
          <span className="font-medium">{deleteText}</span>
        </div>
      </div>
      
      {/* Content */}
      <div
        className={`relative bg-white transition-transform duration-200 ${
          isDeleting ? 'animate-pulse' : ''
        }`}
        style={{ 
          transform: `translateX(${swipeX}px)`,
          opacity: isDeleting ? 0.5 : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};