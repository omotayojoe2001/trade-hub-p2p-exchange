import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c3c39ff4e6fb45248be11c89c6db9a26',
  appName: 'trade-hub-p2p-exchange',
  webDir: 'dist',
  server: {
    url: 'https://c3c39ff4-e6fb-4524-8be1-1c89c6db9a26.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: true,
      spinnerColor: "#fbbf24"
    }
  }
};

export default config;