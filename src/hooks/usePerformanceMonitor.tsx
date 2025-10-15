import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
}

export const usePerformanceMonitor = (operation: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    startTime: Date.now(),
    operation
  });

  const start = () => {
    metricsRef.current.startTime = Date.now();
  };

  const end = () => {
    metricsRef.current.endTime = Date.now();
    metricsRef.current.duration = metricsRef.current.endTime - metricsRef.current.startTime;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${operation} took ${metricsRef.current.duration}ms`);
    }
    
    return metricsRef.current.duration;
  };

  const getDuration = () => {
    if (metricsRef.current.endTime) {
      return metricsRef.current.duration;
    }
    return Date.now() - metricsRef.current.startTime;
  };

  // Auto-start timing
  useEffect(() => {
    start();
  }, []);

  return { start, end, getDuration, metrics: metricsRef.current };
};