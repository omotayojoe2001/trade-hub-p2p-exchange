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
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/security")}
            className="mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Enable 2FA</h1>
        </div>
      </div>
      <div className="p-4">
        <div className="w-full max-w-md mx-auto">
          <BiometricSetup onComplete={handleComplete} onSkip={handleSkip} />
        </div>
      </div>
    </div>
  );
};

export default Enable2FA;