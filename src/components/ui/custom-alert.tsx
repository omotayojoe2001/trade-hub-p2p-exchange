import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { Button } from './button';

interface CustomAlertProps {
  title: string;
  message: string;
  type?: 'warning' | 'success' | 'error' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isOpen
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <X className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-sm w-full border-2 ${getBgColor()}`}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            {getIcon()}
            <h3 className="ml-3 text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mb-6">
            {message}
          </p>
          
          <div className="flex space-x-3">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={onConfirm || onCancel}
              className={`flex-1 ${
                type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' :
                type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for using custom alerts
export const useCustomAlert = () => {
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'success' | 'error' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (config: Omit<typeof alert, 'isOpen'>) => {
    setAlert({ ...config, isOpen: true });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const confirm = (title: string, message: string, onConfirm?: () => void) => {
    return new Promise<boolean>((resolve) => {
      showAlert({
        title,
        message,
        type: 'warning',
        confirmText: 'Yes',
        cancelText: 'No',
        onConfirm: () => {
          hideAlert();
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          hideAlert();
          resolve(false);
        }
      });
    });
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alert}
      onConfirm={() => {
        if (alert.onConfirm) alert.onConfirm();
        hideAlert();
      }}
      onCancel={() => {
        if (alert.onCancel) alert.onCancel();
        hideAlert();
      }}
    />
  );

  return { showAlert, hideAlert, confirm, AlertComponent };
};