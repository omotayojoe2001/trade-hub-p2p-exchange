import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface BankAccountFormProps {
  selectedAccount: string;
  accountName: string;
  selectedBank: string;
  accountNumber: string;
  onSelectedAccountChange: (value: string) => void;
  onAccountNameChange: (value: string) => void;
  onSelectedBankChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onAddAccount?: () => void;
}

const BankAccountForm = ({
  selectedAccount,
  accountName,
  selectedBank,
  accountNumber,
  onSelectedAccountChange,
  onAccountNameChange,
  onSelectedBankChange,
  onAccountNumberChange,
  onAddAccount
}: BankAccountFormProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
        <button
          onClick={onAddAccount}
          className="text-blue-600 font-medium text-sm flex items-center hover:text-blue-700 transition-colors"
        >
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
              onChange={(e) => onSelectedAccountChange(e.target.value)}
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
            onChange={(e) => onAccountNameChange(e.target.value)}
            placeholder="Enter account holder name"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Bank Name</label>
          <div className="relative">
            <select 
              value={selectedBank}
              onChange={(e) => onSelectedBankChange(e.target.value)}
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
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="Enter 10-digit account number"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default BankAccountForm;