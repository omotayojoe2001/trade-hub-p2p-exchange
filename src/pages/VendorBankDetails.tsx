import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { creditsService } from '@/services/creditsService';

interface VendorBankInfo {
  account_number: string;
  bank_name: string;
  account_name: string;
  bank_code?: string;
}

interface JobDetails {
  id: string;
  amount_usd: number;
  amount_naira: number;
  delivery_type: string;
  customer_name: string;
  status: string;
}

const VendorBankDetails = () => {
  const [bankDetails, setBankDetails] = useState<VendorBankInfo | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  
  const navigate = useNavigate();
  const { jobId } = useParams();

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      
      // Get vendor bank details
      const bankInfo = await creditsService.getVendorBankDetails();
      setBankDetails(bankInfo);

      // If jobId is provided, get job details
      if (jobId) {
        // In a real app, you'd fetch job details here
        setJobDetails({
          id: jobId,
          amount_usd: 250,
          amount_naira: 412500, // Example: $250 * 1650 rate
          delivery_type: 'delivery',
          customer_name: 'John Premium',
          status: 'pending_payment'
        });
      }

    } catch (error: any) {
      setError(error.message || 'Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Payment Instructions</h1>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Job Details (if available) */}
        {jobDetails && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-800">Amount (USD):</span>
                <span className="font-semibold text-blue-900">${jobDetails.amount_usd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Amount to Pay (Naira):</span>
                <span className="font-semibold text-blue-900">₦{jobDetails.amount_naira.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Service Type:</span>
                <span className="font-semibold text-blue-900">
                  {jobDetails.delivery_type === 'delivery' ? 'Cash Delivery' : 'Cash Pickup'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Customer:</span>
                <span className="font-semibold text-blue-900">{jobDetails.customer_name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-red-900">⚠️ Important Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>DO NOT pay the crypto seller directly!</strong> You must pay our delivery agent's account below.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm">
              <p>1. Transfer the exact Naira amount to the account below</p>
              <p>2. Our delivery agent will confirm your payment</p>
              <p>3. Your crypto will be released automatically</p>
              <p>4. The agent will deliver cash to the premium user</p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        {bankDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>Pay to This Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Name */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Bank Name</p>
                  <p className="font-semibold text-lg">{bankDetails.bank_name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.bank_name, 'bank')}
                  className="ml-2"
                >
                  {copied === 'bank' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="font-semibold text-xl text-blue-600">{bankDetails.account_number}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.account_number, 'account')}
                  className="ml-2"
                >
                  {copied === 'account' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Account Name */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="font-semibold text-lg">{bankDetails.account_name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.account_name, 'name')}
                  className="ml-2"
                >
                  {copied === 'name' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Amount to Pay */}
              {jobDetails && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div>
                    <p className="text-sm text-green-700">Amount to Transfer</p>
                    <p className="font-bold text-2xl text-green-800">₦{jobDetails.amount_naira.toLocaleString()}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(jobDetails.amount_naira.toString(), 'amount')}
                    className="ml-2 border-green-300 text-green-700"
                  >
                    {copied === 'amount' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Badge */}
        <div className="text-center mb-6">
          <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2">
            Waiting for Your Payment
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => {
              alert('Payment confirmation will be handled by our delivery agent. You will be notified once payment is confirmed.');
            }}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
          >
            I Have Made the Payment
          </Button>
          
          <Button
            onClick={() => navigate('/my-trades')}
            variant="outline"
            className="w-full h-12"
          >
            Back to My Trades
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Make sure to transfer the exact amount shown above</p>
            <p>• Use the account details exactly as displayed</p>
            <p>• Payment confirmation may take 5-10 minutes</p>
            <p>• Contact support if you have any issues</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorBankDetails;
