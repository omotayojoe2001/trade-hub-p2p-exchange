import React from 'react';
import { ArrowLeft, Trash2, Mail, AlertTriangle, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const AccountDeletionInstructions = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <Link to="/auth" className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Account Deletion Instructions</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Central Exchange</h1>
          <h2 className="text-xl font-semibold text-gray-800">Account Deletion Instructions</h2>
        </div>

        {/* Introduction */}
        <Card className="bg-blue-50 border-blue-200 p-6">
          <p className="text-blue-800 leading-relaxed">
            At Central Exchange, we respect your privacy and data. If you wish to delete your account and remove all personal information, please follow the instructions below.
          </p>
        </Card>

        {/* Step-by-Step Instructions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step-by-Step Instructions:</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <h4 className="font-medium text-gray-900">Open the Central Exchange App</h4>
                <p className="text-gray-600 text-sm">Log in with your registered account.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <h4 className="font-medium text-gray-900">Go to Settings</h4>
                <p className="text-gray-600 text-sm">Tap on your profile icon → Settings → Account.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <h4 className="font-medium text-gray-900">Request Account Deletion</h4>
                <p className="text-gray-600 text-sm">Tap "Delete Account".</p>
                <p className="text-gray-600 text-sm">Confirm your request by following the on-screen instructions.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Alternative Method */}
        <Card className="bg-orange-50 border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
            <Mail className="mr-2" size={20} />
            Alternative Method (Email Request)
          </h3>
          
          <div className="space-y-3 text-orange-700">
            <p>If you cannot delete your account via the app, send a request to:</p>
            <div className="bg-white border border-orange-300 rounded-lg p-3">
              <p className="font-medium text-orange-800">support@centralexchange.com</p>
            </div>
            <ul className="space-y-1 text-sm">
              <li>• Include your registered email</li>
              <li>• Include a request to delete your account</li>
            </ul>
            <div className="flex items-center text-sm">
              <Clock className="mr-2" size={16} />
              <span>Our team will delete your account within 3 business days.</span>
            </div>
          </div>
        </Card>

        {/* Important Notes */}
        <Card className="bg-red-50 border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
            <AlertTriangle className="mr-2" size={20} />
            Important Notes:
          </h3>
          
          <ul className="space-y-2 text-red-700 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Deleting your account is permanent. All personal information, transaction history, and profile data will be removed.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Once deleted, your username and account cannot be recovered.</span>
            </li>
          </ul>
        </Card>

        {/* Contact Support */}
        <Card className="bg-green-50 border-green-200 p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <Shield className="mr-2" size={20} />
            Contact Support:
          </h3>
          
          <p className="text-green-700 mb-3">For questions or assistance, email:</p>
          <div className="bg-white border border-green-300 rounded-lg p-3 mb-4">
            <p className="font-medium text-green-800">support@centralexchange.com</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => window.location.href = 'mailto:support@centralexchange.com?subject=Account Deletion Request'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Mail className="mr-2" size={16} />
              Email Support
            </Button>
            <Link to="/auth">
              <Button variant="outline" className="border-green-300 text-green-700">
                Back to App
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountDeletionInstructions;