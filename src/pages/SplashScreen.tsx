import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(true);

  const handleNavigation = () => {
    setShowContent(false);
    setTimeout(() => {
      if (user) {
        // Check if profile is complete
        navigate("/home");
      } else {
        navigate("/auth");
      }
    }, 500);
  };

  // Video handles navigation on end, no timer needed

  return (
    <div className="fixed inset-0 w-full h-full" style={{ backgroundColor: '#192f4a', zIndex: 9999 }}>
      <div className={`w-full h-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <video 
          src="/splash-animation.mp4" 
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          onEnded={handleNavigation}
          onError={() => {
            // Fallback: navigate after 3 seconds if video fails
            setTimeout(handleNavigation, 3000);
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;