import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ReliableVideo from "@/components/ReliableVideo";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleNavigation = () => {
    if (hasNavigated) return;
    setHasNavigated(true);
    sessionStorage.setItem('splash-shown', 'true');
    
    setShowContent(false);
    setTimeout(() => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    }, 300);
  };

  // Auto-navigate after 3 seconds (reduced from 7)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNavigation();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Fallback if video fails to load
  useEffect(() => {
    if (videoError) {
      const fallbackTimer = setTimeout(() => {
        handleNavigation();
      }, 2000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [videoError]);

  return (
    <div className="fixed inset-0 w-full h-full" style={{ backgroundColor: '#192f4a', zIndex: 9999, overflow: 'hidden' }}>
      <div className={`w-full h-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ overflow: 'hidden' }}>
        {!videoError ? (
          <ReliableVideo
            src="/splash-animation.mp4"
            onEnded={handleNavigation}
            onError={() => {
              console.log('Video failed to load, using fallback');
              setVideoError(true);
            }}
            className="w-full h-full object-cover pointer-events-none"
            style={{ backgroundColor: '#192f4a' }}
          />
        ) : (
          // Fallback animated splash screen
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#192f4a' }}>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 border-8 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-4 border-blue-300 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-8 w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">CE</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Central Exchange</h1>
              <p className="text-blue-200 text-xl mb-2">P2P Trading Platform</p>
              <p className="text-blue-300 text-sm mb-8">Secure • Fast • Reliable</p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;