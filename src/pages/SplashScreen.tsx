import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-variant flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-primary text-2xl font-bold">₦</span>
        </div>
        <h1 className="text-white text-3xl font-bold mb-2">CryptoTrade</h1>
        <p className="text-white/80">Your trusted crypto marketplace</p>
      </div>
    </div>
  );
};

export default SplashScreen;