// Video preloader utility for reliable video loading
export const preloadVideo = (src: string): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    const cleanup = () => {
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadeddata', onLoaded);
    };
    
    const onCanPlay = () => {
      cleanup();
      resolve(video);
    };
    
    const onLoaded = () => {
      cleanup();
      resolve(video);
    };
    
    const onError = () => {
      cleanup();
      reject(new Error('Video failed to load'));
    };
    
    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('error', onError);
    
    // Set source and start loading
    video.src = src;
    video.load();
    
    // Timeout after 5 seconds
    setTimeout(() => {
      cleanup();
      reject(new Error('Video load timeout'));
    }, 5000);
  });
};

// Check if video file exists
export const checkVideoExists = async (src: string): Promise<boolean> => {
  try {
    const response = await fetch(src, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Get video sources in order of preference
export const getVideoSources = (): string[] => {
  const isCapacitor = !!(window as any).Capacitor;
  
  if (isCapacitor) {
    return [
      './assets/splash-animation.mp4',
      '/assets/splash-animation.mp4',
      'assets/splash-animation.mp4',
      '/splash-animation.mp4'
    ];
  }
  
  return [
    '/splash-animation.mp4',
    './splash-animation.mp4',
    './public/splash-animation.mp4'
  ];
};