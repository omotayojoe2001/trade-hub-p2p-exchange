
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface SelectMerchantPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectMerchantPopup: React.FC<SelectMerchantPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins' }}>
            Sell BTC/USDT
          </h1>
          <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Inter' }}>
            Choose How You Want to Be Matched
          </p>
          <p className="text-sm font-light text-gray-600" style={{ fontFamily: 'Inter' }}>
            Select how you'd prefer to connect with a verified merchant for this transaction.
          </p>
        </div>

        {/* Merchant Options */}
        <div className="space-y-4 mb-6">
          {/* Auto-Match */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                  Auto-Match
                </h3>
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded" style={{ fontFamily: 'Poppins' }}>
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Inter' }}>
                Let the platform connect you with a fast, trusted merchant
              </p>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>
              <p>• Based on rates, trust score, and speed</p>
              <div className="flex items-center">
                <Clock size={14} className="mr-1 text-gray-600" />
                <span>2-5 minutes</span>
              </div>
            </div>
          </Card>

          {/* Manual Select */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins' }}>
                Manual Select
              </h3>
              <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Inter' }}>
                Browse and choose your preferred merchant
              </p>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>
              <p>• View merchant rates, ratings, and response time</p>
              <div className="flex items-center">
                <Clock size={14} className="mr-1 text-gray-600" />
                <span>5-15 minutes</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Safety Notice */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <p className="text-xs italic text-gray-500 text-center leading-relaxed" style={{ fontFamily: 'Inter' }}>
            You are transacting peer-to-peer. Your crypto is escrowed for safety and will only be released when both parties confirm. Always review merchant ratings before choosing.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onClose}
            className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl"
            style={{ fontFamily: 'Poppins' }}
          >
            Continue
          </Button>
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-blue-500 font-medium"
              style={{ fontFamily: 'Inter' }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectMerchantPopup;
