import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // If user is authenticated, go to home, otherwise go to auth
      if (!loading) {
        if (user) {
          navigate("/home");
        } else {
          navigate("/auth");
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-primary text-2xl font-bold">₦</span>
        </div>
        <h1 className="text-primary-foreground text-3xl font-bold mb-2">CryptoTrade</h1>
        <p className="text-primary-foreground/80">Your trusted crypto marketplace</p>
      </div>
    </div>
  );
};

export default SplashScreen;