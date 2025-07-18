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
    // Navigate to sell crypto match screen
    navigate('/sell-crypto-match', { 
      state: { 
        amount, 
        nairaValue: calculateNairaValue(),
        paymentMethod: selectedPayment,
        bankDetails: selectedPayment === 'bank' ? {
          accountName,
          selectedBank,
          accountNumber
        } : null,
        notes
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg text-lg font-medium"
        >
          Send Trade Request
        </Button>
      </div>
    </div>
  );
};

export default SellCrypto;
