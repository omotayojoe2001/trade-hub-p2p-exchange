
import React from 'react';
import { ArrowLeft, MoreVertical, Building2, Bell, MessageSquare, AlertTriangle, FileText, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const PaymentStatus = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/my-trades">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Payment Status</h1>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      {/* Progress Steps */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-600 font-medium">Request</p>
              <p className="text-xs text-green-600">Sent</p>
            </div>
          </div>
          
          <div className="flex-1 h-px bg-green-500 mx-3"></div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-600 font-medium">Crypto</p>
              <p className="text-xs text-green-600">Sent</p>
            </div>
          </div>
          
          <div className="flex-1 h-px bg-blue-500 mx-3"></div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">3</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Waiting</p>
              <p className="text-xs text-blue-600">Payment</p>
            </div>
          </div>
          
          <div className="flex-1 h-px bg-gray-300 mx-3"></div>
          
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
              <span className="text-gray-500 text-xs">4</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 size={40} className="text-blue-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Merchant is Paying You</h2>
        <p className="text-gray-600 mb-8">You've sent your crypto to escrow. The merchant is now sending your payment.</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Payment in Progress</span>
            <div className="flex items-center">
              <div className="w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="75, 100"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">75%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Estimated Time: 30 mins</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs">⚠</span>
            </div>
            <div className="text-left">
              <p className="text-orange-800 font-medium">Auto-refund in 29:45</p>
              <p className="text-orange-600 text-sm">If merchant doesn't respond</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 space-y-3">
        <Button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center">
          <Bell size={16} className="mr-2" />
          Remind Merchant
        </Button>
        
        <Button className="w-full bg-blue-50 text-blue-600 py-3 rounded-lg hover:bg-blue-100 flex items-center justify-center">
          <MessageSquare size={16} className="mr-2" />
          Message Merchant
        </Button>
        
        <Button variant="outline" className="w-full border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center">
          <AlertTriangle size={16} className="mr-2" />
          Report/Dispute
        </Button>
      </div>

      {/* Trade Summary */}
      <div className="p-6 mt-6">
        <div className="flex items-center mb-4">
          <FileText size={20} className="text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Trade Summary</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Sold</span>
            <span className="font-medium text-gray-900">0.0032 BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Receiving</span>
            <span className="font-medium text-gray-900">₦561,600</span>
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
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
            <p className="text-blue-800 text-sm">
              Your crypto is securely held in escrow. It will be released only when you confirm payment or when the timer completes without dispute.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
