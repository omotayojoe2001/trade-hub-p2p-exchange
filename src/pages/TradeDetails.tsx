
import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Copy, Upload, Camera, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const TradeDetails = () => {
  const [txId, setTxId] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/my-trades">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Trade Details</h1>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      {/* QR Code Section */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send to this Wallet Address</h2>
        
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
            <span className="mr-1">📱</span>
            Tap to enlarge
          </button>
        </div>

        {/* Address Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">BTC Address</h3>
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-gray-900 font-mono">bc1qxy2kgdygjrsqtzq2n0yrf249</span>
            <button className="text-blue-600">
              <Copy size={16} />
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mt-1">
            <span className="text-sm text-gray-900 font-mono">3p83kkfjhx0wlh</span>
          </div>
        </div>

        {/* Amount Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount to Send:</span>
            <span className="font-semibold text-gray-900">0.0032 BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Value:</span>
            <span className="font-semibold text-gray-900">₦561,600</span>
          </div>
          <p className="text-sm text-gray-500 text-center">Network Fee Not Included</p>
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
          <span className="mr-2">💼</span>
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
              onChange={(e) => setTxId(e.target.value)}
              placeholder="Enter TXID for auto-verification"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-4">Or Upload Screenshot</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload Screenshot</h4>
              <p className="text-sm text-gray-500">From gallery or camera</p>
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
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  Crypto must be sent exactly as shown.
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">🔴</span>
                  The platform is not responsible for underpaid or misdirected transactions.
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  Delays in payment may affect transaction speed.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <Button className="w-full bg-gray-300 text-gray-600 py-4 rounded-lg mt-6 text-lg font-medium">
          I've Sent Crypto
        </Button>
      </div>
    </div>
  );
};

export default TradeDetails;
