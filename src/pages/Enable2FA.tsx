import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import BiometricSetup from "@/components/BiometricSetup";

const Enable2FA = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/security");
  };

  const handleSkip = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="relative w-full max-w-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/security")}
          className="absolute -top-12 left-0 z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <BiometricSetup onComplete={handleComplete} onSkip={handleSkip} />
      </div>
    </div>
  );
};

export default Enable2FA;