import React, { useState } from 'react';
import { ArrowLeftRight, ArrowDown, Bell, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';

const BuySell = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState('BTC');

  const coins = [
    { name: 'Bitcoin', symbol: 'BTC' },
    { name: 'Ethereum', symbol: 'ETH' },
    { name: 'Litecoin', symbol: 'LTC' },
  ];

  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleCoinSelect = (coin: string) => {
    setSelectedCoin(coin);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', {
      activeTab,
      amount,
      selectedCoin,
      paymentMethod,
      bankDetails,
    });
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Buy & Sell</h1>
          <p className="text-sm text-gray-500 mt-1">Trade cryptocurrencies instantly</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/notifications">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Bell size={16} className="text-yellow-600" />
            </div>
          </Link>
          <Link to="/settings">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Settings size={16} className="text-gray-600" />
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-around p-4">
        <button
          className={`px-6 py-2 rounded-full font-medium text-sm ${
            activeTab === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => handleTabChange('buy')}
        >
          Buy
        </button>
        <button
          className={`px-6 py-2 rounded-full font-medium text-sm ${
            activeTab === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => handleTabChange('sell')}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Enter Amount
          </label>
          <Input
            type="number"
            id="amount"
            className="w-full h-12 bg-gray-50 border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>

        {/* Coin Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Cryptocurrency
          </label>
          <div className="flex space-x-3">
            {coins.map((coin) => (
              <button
                key={coin.symbol}
                className={`px-4 py-2 rounded-full font-medium text-sm ${
                  selectedCoin === coin.symbol ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => handleCoinSelect(coin.symbol)}
              >
                {coin.name} ({coin.symbol})
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Payment Method
          </label>
          <div className="flex space-x-3">
            <button
              className={`px-4 py-2 rounded-full font-medium text-sm ${
                paymentMethod === 'bank' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handlePaymentMethodChange('bank')}
            >
              Bank Transfer
            </button>
            <button
              className={`px-4 py-2 rounded-full font-medium text-sm ${
                paymentMethod === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handlePaymentMethodChange('card')}
            >
              Credit Card
            </button>
          </div>
        </div>

        {/* Bank Details (if bank transfer is selected) */}
        {paymentMethod === 'bank' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Bank Details
            </label>
            <Input
              type="text"
              placeholder="Account Name"
              className="w-full h-12 bg-gray-50 border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={bankDetails.accountName}
              onChange={(e) => handleBankDetailsChange('accountName', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Account Number"
              className="w-full h-12 bg-gray-50 border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={bankDetails.accountNumber}
              onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Bank Name"
              className="w-full h-12 bg-gray-50 border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={bankDetails.bankName}
              onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
          onClick={handleSubmit}
        >
          {activeTab === 'buy' ? 'Buy Now' : 'Sell Now'}
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default BuySell;
