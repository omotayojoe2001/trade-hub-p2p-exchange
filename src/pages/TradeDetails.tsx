
import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Copy, Upload, Camera, AlertTriangle, Star, Smartphone, Wallet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useParams } from 'react-router-dom';

const TradeDetails = () => {
  const { tradeId } = useParams();
  const [txId, setTxId] = useState('');
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const navigate = useNavigate();

  // Mock transactions data for demo
  const mockTransactions = [
    {
      id: 1,
      amount: '0.05 BTC',
      nairaAmount: '₦45,200,000',
      total: '₦2,260,000',
      txId: 'TXN123456789',
      date: '2023-10-26',
      time: '14:30',
      merchant: 'Michael Adebayo',
      merchantAvatar: 'MA',
      rating: 4.8,
      status: 'completed',
      coin: 'BTC',
      type: 'sell',
      merchantPhone: '+234 801 234 5678',
      bankAccount: 'GT Bank - 0123456789',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    },
    {
      id: 2,
      amount: '1.2 ETH',
      nairaAmount: '₦3,450,000',
      total: '₦4,140,000',
      txId: 'TXN789012345',
      date: '2023-10-25',
      time: '09:15',
      merchant: 'Sarah Johnson',
      merchantAvatar: 'SJ',
      rating: 4.5,
      status: 'pending',
      coin: 'ETH',
      type: 'buy',
      merchantPhone: '+234 802 345 6789',
      bankAccount: 'Access Bank - 0987654321',
      walletAddress: '0x742d35Cc6634C0532925a3b8D563C9A7c3c6b0E2'
    }
  ];

  // Find the transaction data based on URL txId
  const foundTransaction = mockTransactions.find(t => t.txId === tradeId || String(t.id) === tradeId);
  
  // Mock transaction data - use found transaction or default
  const transactionDetails = foundTransaction ? {
    id: foundTransaction.txId,
    amount: foundTransaction.amount,
    nairaAmount: foundTransaction.nairaAmount,
    total: foundTransaction.total,
    date: foundTransaction.date,
    time: foundTransaction.time,
    status: foundTransaction.status,
    coin: foundTransaction.coin,
    type: foundTransaction.type,
    walletAddress: foundTransaction.walletAddress,
    merchant: {
      name: foundTransaction.merchant,
      avatar: foundTransaction.merchantAvatar,
      rating: foundTransaction.rating,
      phone: foundTransaction.merchantPhone,
      bankAccount: foundTransaction.bankAccount,
      trades: Math.floor(Math.random() * 500) + 50
    }
  } : {
    id: tradeId || 'TXN123456789',
    amount: '0.05 BTC',
    nairaAmount: '₦45,200,000',
    total: '₦2,260,000',
    date: '2023-10-26',
    time: '14:30',
    status: 'completed',
    coin: 'BTC',
    type: 'sell',
    walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    merchant: {
      name: 'John Merchant',
      avatar: 'JM',
      rating: 4.8,
      phone: '+234 901 234 5678',
      bankAccount: 'First Bank - 0123456789',
      trades: 234
    }
  };

  const handleTxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTxId(value);
    setIsButtonEnabled(value.trim().length > 0 || proofUploaded);
  };

  const handleProofUpload = () => {
    // Simulate file upload
    setProofUploaded(true);
    setIsButtonEnabled(true);
  };

  const handleSentCrypto = () => {
    navigate('/payment-status');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/trade-history">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Transaction Details</h1>
            <p className="text-sm text-gray-500">{transactionDetails.id}</p>
          </div>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      {/* Transaction Summary */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{transactionDetails.amount}</h2>
          <p className="text-lg text-gray-600">@ {transactionDetails.nairaAmount} per {transactionDetails.coin}</p>
          <p className="text-xl font-semibold text-gray-900 mt-2">Total: {transactionDetails.total}</p>
          <div className="flex items-center justify-center mt-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              transactionDetails.status === 'completed' ? 'bg-green-100 text-green-700' :
              transactionDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {transactionDetails.status.charAt(0).toUpperCase() + transactionDetails.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Status-specific content */}
      {transactionDetails.status === 'completed' && (
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-900">Trade completed</h3>
            <p className="text-sm text-green-800 mt-1">Funds have been released successfully.</p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900">{transactionDetails.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium text-gray-900">{transactionDetails.date} • {transactionDetails.time}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-medium text-gray-900">{transactionDetails.merchant.name}</span>
            </div>
          </div>
        </div>
      )}

      {transactionDetails.status === 'pending' && (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <div className="flex items-center">
              <Loader2 size={18} className="text-yellow-700 mr-2 animate-spin" />
              <p className="text-yellow-800 text-sm font-medium">Waiting for merchant confirmation</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-gray-50 rounded-lg p-6 text-center mb-4">
            <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                  ></div>
                ))}
              </div>
            </div>
            <button className="text-blue-600 text-sm font-medium flex items-center justify-center mx-auto">
              <Smartphone size={14} className="mr-1" />
              Tap to enlarge
            </button>
          </div>

          {/* Address Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{transactionDetails.coin} Address</h3>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-900 font-mono">{transactionDetails.walletAddress}</span>
              <button className="text-blue-600">
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-sm text-gray-900">{transactionDetails.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-semibold text-gray-900">{transactionDetails.date} • {transactionDetails.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant:</span>
              <div className="text-right">
                <span className="font-semibold text-gray-900">{transactionDetails.merchant.name}</span>
                <div className="flex items-center text-sm text-gray-500">
                  <Star size={14} className="text-yellow-500 mr-1" />
                  <span>{transactionDetails.merchant.rating} ({transactionDetails.merchant.trades} trades)</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium text-gray-900">{transactionDetails.merchant.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Account:</span>
              <span className="font-medium text-gray-900">{transactionDetails.merchant.bankAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trade Type:</span>
              <span className={`font-medium ${transactionDetails.type === 'buy' ? 'text-green-600' : 'text-blue-600'}`}>
                {transactionDetails.type === 'buy' ? 'Buying' : 'Selling'} {transactionDetails.coin}
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
            <div className="flex items-center">
              <AlertTriangle size={16} className="text-orange-600 mr-2" />
              <span className="text-orange-800 font-medium">Address valid for: 14:32</span>
            </div>
          </div>

          {/* Open Wallet Button */}
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mb-8 flex items-center justify-center">
            <Wallet size={18} className="mr-2" />
            Open Wallet App
          </Button>

          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload TXID or Screenshot</h3>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Transaction ID (Optional)</label>
              <input
                type="text"
                value={txId}
                onChange={handleTxIdChange}
                placeholder="Enter TXID for auto-verification"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {txId && (
                <div className="flex items-center mt-2 text-green-600 text-sm">
                  <CheckCircle size={14} className="mr-1" />
                  TXID entered successfully
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-4">Or Upload Screenshot</p>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
                  proofUploaded 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}
                onClick={handleProofUpload}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  proofUploaded ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {proofUploaded ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Upload size={24} className="text-gray-400" />
                  )}
                </div>
                <h4 className={`font-medium mb-2 ${proofUploaded ? 'text-green-800' : 'text-gray-900'}`}>
                  {proofUploaded ? 'Screenshot Uploaded!' : 'Upload Screenshot'}
                </h4>
                <p className={`text-sm ${proofUploaded ? 'text-green-600' : 'text-gray-500'}`}>
                  {proofUploaded ? 'Payment proof received' : 'From gallery or camera'}
                </p>
              </div>
            </div>
          </div>

          {/* Important Notices */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <AlertTriangle size={16} className="text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Important Notices</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li className="flex items-start">
                    <AlertTriangle size={14} className="text-yellow-600 mr-2 mt-0.5" />
                    Crypto must be sent exactly as shown.
                  </li>
                  <li className="flex items-start">
                    <XCircle size={14} className="text-red-600 mr-2 mt-0.5" />
                    The platform is not responsible for underpaid or misdirected transactions.
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle size={14} className="text-yellow-600 mr-2 mt-0.5" />
                    Delays in payment may affect transaction speed.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSentCrypto}
            disabled={!isButtonEnabled}
            className={`w-full py-4 rounded-lg mt-6 text-lg font-medium transition-all ${
              isButtonEnabled 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            I've Sent Crypto
          </Button>
        </div>
      )}

      {(transactionDetails.status === 'failed' || transactionDetails.status === 'cancelled') && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <XCircle size={28} className="text-red-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-red-900">Trade {transactionDetails.status}</h3>
            <p className="text-sm text-red-800 mt-1">Reason: Payment not confirmed within the time window.</p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900">{transactionDetails.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium text-gray-900">{transactionDetails.date} • {transactionDetails.time}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeDetails;
