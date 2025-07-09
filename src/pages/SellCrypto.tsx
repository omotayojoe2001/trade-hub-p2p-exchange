import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, ChevronDown, Plus, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';

const SellCrypto = () => {
  const [amount, setAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('bank');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [currentRate, setCurrentRate] = useState(1755000);
  const navigate = useNavigate();

  // Simulate real-time rate changes
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 10000; // ±5000 variation
      setCurrentRate(prev => Math.max(1745000, Math.min(1765000, prev + variation)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const calculateNairaValue = () => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount) * currentRate;
  };

  const handleSendTradeRequest = () => {
    navigate('/merchant-selection');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/merchant-selection">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Sell Crypto</h1>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      <div className="p-4 space-y-6">
        {/* Amount Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount to Sell</h2>
          
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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

        {/* Payment Method */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How would you like to receive your cash?</h3>
          
          <div className="space-y-3">
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPayment === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPayment('bank')}
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
              onClick={() => setSelectedPayment('delivery')}
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
              onClick={() => setSelectedPayment('pickup')}
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

        {/* Bank Account Details */}
        {selectedPayment === 'bank' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
              <button className="text-blue-600 font-medium text-sm flex items-center">
                <Plus size={16} className="mr-1" />
                Add Account
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Favorite Account</label>
                <div className="relative">
                  <select 
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select saved account</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter account holder name"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Bank Name</label>
                <div className="relative">
                  <select 
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your bank</option>
                    <option value="gtbank">GTBank</option>
                    <option value="access">Access Bank</option>
                    <option value="zenith">Zenith Bank</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter 10-digit account number"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes / Instructions</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for the merchant, e.g., account for differences"
            rows={3}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">
            Specify details for handling any discrepancies or special instructions
          </p>
          
          <div className="flex items-center mt-3">
            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full mr-3">
              <span className="text-blue-600 mr-1">🔧</span>
              <span className="text-blue-700 text-sm font-medium">Auto-Assign Difference Account</span>
            </div>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">Security Notice</h4>
              <p className="text-green-700 text-sm mb-2">
                Your crypto will be escrowed and released only when both parties confirm the trade completion.
              </p>
              <p className="text-green-700 text-sm">
                We don't hold your funds - this ensures maximum security.
              </p>
            </div>
          </div>
        </div>

        {/* Premium Banner */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Unlock Premium Features</h4>
              <p className="text-sm text-orange-100 mb-2">Access cash delivery & pickup options</p>
            </div>
            <Button className="bg-white text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-lg font-medium">
              Upgrade Now
            </Button>
          </div>
        </div>

        {/* Send Trade Request Button */}
        <Button 
          onClick={handleSendTradeRequest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg text-lg font-medium"
        >
          Send Trade Request
        </Button>
      </div>
    </div>
  );
};

export default SellCrypto;
