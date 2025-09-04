import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import AmountInput from '@/components/sell-crypto/AmountInput';
import PaymentMethodSelector from '@/components/sell-crypto/PaymentMethodSelector';
import BankAccountForm from '@/components/sell-crypto/BankAccountForm';
import NotesSection from '@/components/sell-crypto/NotesSection';
import SecurityNotice from '@/components/sell-crypto/SecurityNotice';
import PremiumBanner from '@/components/sell-crypto/PremiumBanner';

const SellCrypto = () => {
  const [amount, setAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('bank');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [currentRate, setCurrentRate] = useState(1755000);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
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

  const handleAddAccount = () => {
    setShowAddAccountModal(true);
  };

  const handleSaveAccount = () => {
    // In a real app, this would save to the user's profile/database
    // For now, we'll just close the modal and show success
    setShowAddAccountModal(false);
    alert('Bank account saved successfully!');
  };

  const handleSendTradeRequest = () => {
    // Validate required fields for sell crypto
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid crypto amount');
      return;
    }

    if (selectedPayment === 'bank' && (!accountName || !selectedBank || !accountNumber)) {
      alert('Please complete your bank account details');
      return;
    }

    // Navigate to new escrow flow
    navigate('/escrow-flow', {
      state: {
        amount,
        nairaAmount: calculateNairaValue(),
        mode: 'sell',
        bankDetails: selectedPayment === 'bank' ? {
          accountName,
          bankName: selectedBank,
          accountNumber
        } : null
      }
    });
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
        <AmountInput
          amount={amount}
          onAmountChange={setAmount}
          currentRate={currentRate}
          calculateNairaValue={calculateNairaValue}
        />

        {/* Payment Method */}
        <PaymentMethodSelector
          selectedPayment={selectedPayment}
          onPaymentChange={setSelectedPayment}
        />

        {/* Bank Account Details */}
        {selectedPayment === 'bank' && (
          <BankAccountForm
            selectedAccount={selectedAccount}
            accountName={accountName}
            selectedBank={selectedBank}
            accountNumber={accountNumber}
            onSelectedAccountChange={setSelectedAccount}
            onAccountNameChange={setAccountName}
            onSelectedBankChange={setSelectedBank}
            onAccountNumberChange={setAccountNumber}
            onAddAccount={handleAddAccount}
          />
        )}

        {/* Notes */}
        <NotesSection
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Security Notice */}
        <SecurityNotice />

        {/* Premium Banner */}
        <PremiumBanner />

        {/* Send Trade Request Button */}
        <Button
          onClick={handleSendTradeRequest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg text-lg font-medium disabled:bg-gray-400"
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            (selectedPayment === 'bank' && (!accountName || !selectedBank || !accountNumber))
          }
        >
          Send Trade Request
        </Button>

        {/* Add Bank Account Modal */}
        {showAddAccountModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Bank Account</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Account Holder Name</label>
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
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your bank</option>
                    <option value="gtbank">GTBank</option>
                    <option value="access">Access Bank</option>
                    <option value="zenith">Zenith Bank</option>
                    <option value="firstbank">First Bank</option>
                    <option value="uba">UBA</option>
                    <option value="fidelity">Fidelity Bank</option>
                    <option value="union">Union Bank</option>
                    <option value="sterling">Sterling Bank</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter 10-digit account number"
                    maxLength={10}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccount}
                  disabled={!accountName || !selectedBank || !accountNumber || accountNumber.length !== 10}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellCrypto;
