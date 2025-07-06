
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ConfirmationSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ConfirmationSuccess = ({ isOpen, onClose, title, message }: ConfirmationSuccessProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <Button 
          onClick={onClose}
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationSuccess;
