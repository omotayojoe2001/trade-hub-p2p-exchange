import { useEffect } from 'react';

export const useStatusBar = (style: 'light' | 'dark' = 'dark', backgroundColor?: string) => {
  useEffect(() => {
    // Only works on native platforms
    const setStatusBar = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        
        if (Capacitor.isNativePlatform()) {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          
          await StatusBar.setStyle({ 
            style: style === 'light' ? Style.Light : Style.Dark 
          });
          
          if (backgroundColor) {
            await StatusBar.setBackgroundColor({ color: backgroundColor });
          }
        }
      } catch (error) {
        // Silently fail on web
      }
    };

    setStatusBar();
  }, [style, backgroundColor]);

  const setStatusBarStyle = async (newStyle: 'light' | 'dark') => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        
        await StatusBar.setStyle({ 
          style: newStyle === 'light' ? Style.Light : Style.Dark 
        });
      }
    } catch (error) {
      // Silently fail on web
    }
  };

  const hideStatusBar = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.hide();
      }
    } catch (error) {
      // Silently fail on web
    }
  };

  const showStatusBar = async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.show();
      }
    } catch (error) {
      // Silently fail on web
    }
  };

  return {
    setStatusBarStyle,
    hideStatusBar,
    showStatusBar
  };
};