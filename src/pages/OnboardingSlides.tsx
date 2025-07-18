import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Trade Crypto Safely",
    description: "Buy and sell cryptocurrency with verified merchants in a secure escrow system",
    image: "🛡️"
  },
  {
    title: "Best Exchange Rates",
    description: "Get competitive rates and track real-time market prices across multiple exchanges",
    image: "📈"
  },
  {
    title: "Instant Settlements",
    description: "Complete transactions quickly with our automated matching system",
    image: "⚡"
  }
];

const OnboardingSlides = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/auth");
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipOnboarding = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={prevSlide} disabled={currentSlide === 0}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" onClick={skipOnboarding}>
          Skip
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6">{slides[currentSlide].image}</div>
            <h2 className="text-2xl font-bold mb-4">{slides[currentSlide].title}</h2>
            <p className="text-muted-foreground mb-8">{slides[currentSlide].description}</p>
            
            <div className="flex justify-center space-x-2 mb-8">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentSlide ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            
            <Button onClick={nextSlide} className="w-full">
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingSlides;