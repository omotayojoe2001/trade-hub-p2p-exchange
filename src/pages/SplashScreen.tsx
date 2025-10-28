import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);

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

  // Auto-navigate after 7 seconds as fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNavigation();
    }, 7000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full" style={{ backgroundColor: '#192f4a', zIndex: 9999, overflow: 'hidden' }}>
      <div className={`w-full h-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ overflow: 'hidden' }}>
        <video 
          src="/splash-animation.mp4" 
          autoPlay
          muted
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          className="w-full h-full object-cover pointer-events-none"
          style={{ 
            backgroundColor: '#192f4a',
            outline: 'none',
            border: 'none'
          }}
          onEnded={handleNavigation}
          onError={handleNavigation}
          onCanPlay={(e) => {
            e.currentTarget.controls = false;
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;