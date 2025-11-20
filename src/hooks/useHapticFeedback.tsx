import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Conditional import for haptics
let Haptics: any = null;
let ImpactStyle: any = null;

if (Capacitor.isNativePlatform()) {
  try {
    import('@capacitor/haptics').then(module => {
      Haptics = module.Haptics;
      ImpactStyle = module.ImpactStyle;
    });
  } catch (error) {
    console.warn('Haptics plugin not available:', error);
  }
}

export const useHapticFeedback = () => {
  const isNative = Capacitor.isNativePlatform();

  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (isNative && Haptics && ImpactStyle) {
      try {
        const impactStyle = style === 'light' ? ImpactStyle.Light : 
                           style === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium;
        await Haptics.impact({ style: impactStyle });
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    } else {
      // Web fallback
      if (navigator.vibrate) {
        const duration = style === 'light' ? 50 : style === 'heavy' ? 200 : 100;
        navigator.vibrate(duration);
      }
    }
  }, [isNative]);

  const notification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (isNative && Haptics) {
      try {
        await Haptics.notification({ 
          type: type === 'success' ? 'SUCCESS' : type === 'warning' ? 'WARNING' : 'ERROR' 
        });
      } catch (error) {
        console.warn('Haptic notification not available:', error);
      }
    } else {
      // Web fallback
      if (navigator.vibrate) {
        const pattern = type === 'success' ? [100, 50, 100] : 
                       type === 'warning' ? [200, 100, 200] : [300];
        navigator.vibrate(pattern);
      }
    }
  }, [isNative]);

  const selection = useCallback(async () => {
    if (isNative && Haptics) {
      try {
        await Haptics.selectionStart();
      } catch (error) {
        console.warn('Haptic selection not available:', error);
      }
    } else {
      // Web fallback
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
  }, [isNative]);

  return {
    impact,
    notification,
    selection,
    isAvailable: (isNative && Haptics) || !!navigator.vibrate
  };
};