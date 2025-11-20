import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Conditional import for status bar
let StatusBar: any = null;
let Style: any = null;

if (Capacitor.isNativePlatform()) {
  try {
    const statusBarModule = await import('@capacitor/status-bar');
    StatusBar = statusBarModule.StatusBar;
    Style = statusBarModule.Style;
  } catch (error) {
    console.warn('Status bar plugin not available:', error);
  }
}

export const useStatusBar = (style: 'light' | 'dark' = 'dark', backgroundColor?: string) => {
  useEffect(() => {
    if (Capacitor.isNativePlatform() && StatusBar && Style) {
      const setStatusBar = async () => {
        try {
          await StatusBar.setStyle({ 
            style: style === 'light' ? Style.Light : Style.Dark 
          });
          
          if (backgroundColor) {
            await StatusBar.setBackgroundColor({ color: backgroundColor });
          }
        } catch (error) {
          console.warn('Status bar not available:', error);
        }
      };

      setStatusBar();
    }
  }, [style, backgroundColor]);

  const setStatusBarStyle = async (newStyle: 'light' | 'dark') => {
    if (Capacitor.isNativePlatform() && StatusBar && Style) {
      try {
        await StatusBar.setStyle({ 
          style: newStyle === 'light' ? Style.Light : Style.Dark 
        });
      } catch (error) {
        console.warn('Status bar not available:', error);
      }
    }
  };

  const hideStatusBar = async () => {
    if (Capacitor.isNativePlatform() && StatusBar) {
      try {
        await StatusBar.hide();
      } catch (error) {
        console.warn('Status bar not available:', error);
      }
    }
  };

  const showStatusBar = async () => {
    if (Capacitor.isNativePlatform() && StatusBar) {
      try {
        await StatusBar.show();
      } catch (error) {
        console.warn('Status bar not available:', error);
      }
    }
  };

  return {
    setStatusBarStyle,
    hideStatusBar,
    showStatusBar
  };
};