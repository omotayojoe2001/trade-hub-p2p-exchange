import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'warning' | 'info';
}

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'info'
}: ConfirmationDialogProps) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} className="text-green-600" />;
      case 'warning':
        return <AlertTriangle size={32} className="text-yellow-600" />;
      default:
        return <CheckCircle size={32} className="text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border-2 border-gray-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${getIconBg()} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {getIcon()}
            </div>
            <p className="text-gray-700">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
            >
              {confirmText}
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full py-3 rounded-lg"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;