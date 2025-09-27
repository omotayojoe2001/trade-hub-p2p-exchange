import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [displayText, setDisplayText] = useState("");
  const [showContent, setShowContent] = useState(true);
  const fullText = "CENTRAL EXCHANGE";

  useEffect(() => {
    let currentIndex = 0;
    const typewriterTimer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typewriterTimer);
        // Start fade out after typing is complete
        setTimeout(() => {
          setShowContent(false);
          // Navigate after fade out
          setTimeout(() => {
            if (!loading) {
              if (user) {
                navigate("/home");
              } else {
                navigate("/auth");
              }
            }
          }, 500);
        }, 500);
      }
    }, 150);

    return () => clearInterval(typewriterTimer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className={`text-center transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-4xl font-bold" style={{ color: '#007AFF', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
          {displayText}
          <span className="animate-pulse">|</span>
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;