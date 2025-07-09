import React from 'react';

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  currentRate: number;
  calculateNairaValue: () => number;
}

const AmountInput = ({ amount, onAmountChange, currentRate, calculateNairaValue }: AmountInputProps) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount to Sell</h2>
      
      <div className="relative">
        <input
          type="text"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full text-4xl font-light text-gray-900 bg-transparent border-none outline-none"
          placeholder="0.00"
        />
        <span className="absolute right-0 top-0 text-4xl font-light text-gray-900">BTC</span>
      </div>
      
      <p className="text-sm text-gray-500 mt-2">Enter amount to offer for trade</p>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700">You'll receive</span>
          <span className="text-gray-400">≈</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-500">Rate: ₦{currentRate.toLocaleString()}/BTC</span>
            <div className={`ml-2 w-2 h-2 rounded-full ${
              Math.random() > 0.5 ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}></div>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            ₦{calculateNairaValue().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AmountInput;