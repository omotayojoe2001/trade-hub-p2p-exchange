import React from 'react';

interface PaymentMethodSelectorProps {
  selectedPayment: string;
  onPaymentChange: (method: string) => void;
}

const PaymentMethodSelector = ({ selectedPayment, onPaymentChange }: PaymentMethodSelectorProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">How would you like to receive your cash?</h3>
      
      <div className="space-y-3">
        <div 
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedPayment === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onPaymentChange('bank')}
        >
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 ${
              selectedPayment === 'bank' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {selectedPayment === 'bank' && (
                <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">🏛️</span>
              <div>
                <p className="font-medium text-gray-900">Bank Transfer</p>
                <p className="text-sm text-gray-500">Default option for all users</p>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`p-4 rounded-lg border-2 cursor-pointer ${
            selectedPayment === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => onPaymentChange('delivery')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 ${
                selectedPayment === 'delivery' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedPayment === 'delivery' && (
                  <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">🚚</span>
                <div>
                  <p className="font-medium text-gray-400">Cash Delivery</p>
                </div>
              </div>
            </div>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
              Premium
            </span>
          </div>
        </div>

        <div 
          className={`p-4 rounded-lg border-2 cursor-pointer ${
            selectedPayment === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => onPaymentChange('pickup')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 ${
                selectedPayment === 'pickup' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedPayment === 'pickup' && (
                  <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">📍</span>
                <div>
                  <p className="font-medium text-gray-400">Cash Pickup</p>
                </div>
              </div>
            </div>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
              Premium
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;