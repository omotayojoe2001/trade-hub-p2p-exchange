
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
        {/* Header */}
        <p className="text-lg font-medium text-gray-800 mb-8">Registration</p>

        {/* Success Icon */}
        <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={24} className="text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Registration Successful!
        </h2>

        {/* Body Text */}
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Welcome aboard! You can now access all features and explore the app.
        </p>

        {/* CTA Button */}
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-base"
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
