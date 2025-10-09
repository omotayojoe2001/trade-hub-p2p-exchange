import React from 'react';
import PaymentVerifier from '@/components/PaymentVerifier';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TestBitGo = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/admin/credits" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">BitGo Payment Verification</h1>
        
        <PaymentVerifier />
      </div>
    </div>
  );
};

export default TestBitGo;