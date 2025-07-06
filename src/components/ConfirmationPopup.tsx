
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ isOpen, onClose, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-8">
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-2xl p-8 max-w-sm w-full text-center relative">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full animate-bounce ${
                i % 4 === 0 ? 'bg-blue-500' : 
                i % 4 === 1 ? 'bg-green-500' : 
                i % 4 === 2 ? 'bg-yellow-400' : 'bg-white'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </div>

        {/* Success Icon */}
        <div className="mx-auto mb-6 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <Check size={32} className="text-white" strokeWidth={3} />
        </div>

        {/* Title */}
        <div className="mb-4">
          <p className="text-base text-gray-500 mb-2" style={{ fontFamily: 'Poppins' }}>
            Registration
          </p>
          <h2 className="text-2xl font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
            Registration Successful!
          </h2>
        </div>

        {/* Body Text */}
        <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-xs mx-auto" style={{ fontFamily: 'Inter' }}>
          Welcome aboard! You can now access all features and explore the app.
        </p>

        {/* CTA Button */}
        <Button
          onClick={onContinue}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-95 transition-all duration-200"
          style={{ 
            fontFamily: 'Poppins',
            boxShadow: '0px 4px 12px rgba(74, 144, 226, 0.25)'
          }}
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
