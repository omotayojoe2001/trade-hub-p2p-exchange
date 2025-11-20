import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTransitions = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const navigateWithTransition = (direction: 'forward' | 'backward' = 'forward') => {
    setTransitionDirection(direction);
    setIsTransitioning(true);
  };

  return {
    isTransitioning,
    transitionDirection,
    navigateWithTransition
  };
};