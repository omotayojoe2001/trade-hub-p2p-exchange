import { useState, useEffect, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 60 * 1000; // 60 seconds in milliseconds

const useInactivityDetector = () => {
  const [isInactive, setIsInactive] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsInactive(false);
  }, []);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up interval to check for inactivity
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= INACTIVITY_TIMEOUT) {
        setIsInactive(true);
      }
    }, 1000); // Check every second

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(interval);
    };
  }, [lastActivity, handleActivity]);

  return {
    isInactive,
    resetTimer
  };
};

export default useInactivityDetector;