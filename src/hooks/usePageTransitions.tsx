import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTransitions = () => {
  // Completely disabled - no transitions
  return {
    isTransitioning: false,
    transitionDirection: 'forward' as const,
    navigateWithTransition: () => {}
  };
};