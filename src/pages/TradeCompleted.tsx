import React from 'react';
import { ArrowLeft, Download, Star, MessageSquare, Shield, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';

const TradeCompleted = () => {
  const navigate = useNavigate();

  const handleRateMerchant = () => {
    // Rating functionality
    console.log('Rating merchant');
  };

  const handleDownloadReceipt = () => {
    // Create receipt data
    const receiptData = {
      tradeId: 'TXN-20241209-001',
      date: 'Dec 9, 2024, 2:45 PM',
      amountSold: '0.0032 BTC',
      rate: '₦1,755,000/BTC',
      totalReceived: '₦561,600',
      platformFee: '₦2,808 (0.5%)',
      netAmount: '₦558,792',
      merchant: 'MercyPay',
      bankAccount: 'GTBank • • • • 4875'
    };

    // Create downloadable receipt
    const receiptContent = `
TRADE RECEIPT
====================
Transaction ID: ${receiptData.tradeId}
Date: ${receiptData.date}

TRADE DETAILS
====================
Amount Sold: ${receiptData.amountSold}
Rate: ${receiptData.rate}
Total Received: ${receiptData.totalReceived}
Platform Fee: ${receiptData.platformFee}
Net Amount: ${receiptData.netAmount}

MERCHANT DETAILS
====================
Merchant: ${receiptData.merchant}
Bank Account: ${receiptData.bankAccount}

Thank you for using our platform!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.tradeId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewTrade = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/home">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Trade Completed</h1>
        </div>
      </div>

      {/* Success Section */}
      <div className="p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Trade Completed Successfully!</h2>
        <p className="text-gray-600 mb-8">
          Your crypto has been sent to the merchant and payment has been confirmed.
        </p>
      </div>

      {/* Trade Summary */}
      <div className="px-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield size={20} className="text-green-600 mr-2" />
            Trade Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Sold</span>
              <span className="font-medium text-gray-900">0.0032 BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate</span>
              <span className="font-medium text-gray-900">₦1,755,000/BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Received</span>
              <span className="font-medium text-gray-900">₦561,600</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium text-gray-900">₦2,808 (0.5%)</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Net Amount</span>
              <span className="font-bold text-gray-900">₦558,792</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant</span>
              <div className="flex items-center">
                <span className="font-medium text-gray-900 mr-2">MercyPay</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Account</span>
              <span className="font-medium text-gray-900">GTBank • • • • 4875</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-medium text-gray-900">TXN-20241209-001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-medium text-gray-900">Dec 9, 2024, 2:45 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 space-y-3">
        <Button 
          onClick={handleDownloadReceipt}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center"
        >
          <Download size={16} className="mr-2" />
          Download Receipt
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleRateMerchant}
            variant="outline" 
            className="py-3 rounded-lg flex items-center justify-center"
          >
            <Star size={16} className="mr-2" />
            Rate Merchant
          </Button>
          
          <Button 
            variant="outline" 
            className="py-3 rounded-lg flex items-center justify-center"
          >
            <MessageSquare size={16} className="mr-2" />
            Leave Feedback
          </Button>
        </div>
        
        <Button 
          onClick={handleNewTrade}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200"
        >
          Start New Trade
        </Button>
      </div>

      {/* Security Notice */}
      <div className="p-6 mt-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">Trade Secured</h4>
              <p className="text-green-700 text-sm">
                This trade was completed using our secure escrow system. Your transaction details have been recorded for your security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCompleted;