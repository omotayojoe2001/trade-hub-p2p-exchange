import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (received: boolean) => void;
  amount: number;
  bankAccount: string;
  merchantName: string;
  bankName?: string;
}

const PaymentConfirmationDialog = ({ isOpen, onClose, onConfirm, amount, bankAccount, merchantName, bankName }: PaymentConfirmationDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Payment Confirmation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Have you received your payment?
            </h4>
            <p className="text-gray-600 text-sm">
              Please confirm if you have received ₦{amount.toLocaleString()} in your {bankAccount} account.
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expected Amount:</span>
                <span className="font-medium text-gray-900">₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bank Name:</span>
                <span className="font-medium text-gray-900">{bankName || 'Your Bank'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bank Account:</span>
                <span className="font-medium text-gray-900">{bankAccount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Merchant:</span>
                <span className="font-medium text-gray-900">{merchantName}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle size={16} className="text-yellow-600 mr-2 mt-0.5" />
              <p className="text-yellow-800 text-sm">
                Only confirm if you have actually received the payment. False confirmations cannot be undone.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => onConfirm(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
            >
              Yes, I've Received Payment
            </Button>
            
            <Button 
              onClick={() => onConfirm(false)}
              variant="outline"
              className="w-full border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50"
            >
              No, I Haven't Received Payment
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full py-3 rounded-lg"
            >
              Let Me Check Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationDialog;