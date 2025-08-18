import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, Upload, Camera, MessageCircle, AlertTriangle, CheckCircle, FileText, Flag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const MerchantTradeFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { request } = location.state || {};
  
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [proofUploaded, setProofUploaded] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('payment'); // payment, waiting, completed

  // Mock user bank details (in production, fetch from API)
  const userBankDetails = {
    bankName: 'First Bank Nigeria',
    accountNumber: '3127584950',
    accountName: 'John Doe',
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && step !== 'completed') {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, step]);

  const handleUploadProof = () => {
    setProofUploaded(true);
    toast({
      title: "Proof Uploaded",
      description: "Payment proof has been uploaded successfully",
    });
  };

  const handleMarkAsPaid = () => {
    if (!proofUploaded) {
      toast({
        title: "Upload Required",
        description: "Please upload proof of payment first",
        variant: "destructive"
      });
      return;
    }
    
    setStep('waiting');
    toast({
      title: "Payment Marked",
      description: "Waiting for user confirmation of cash receipt",
    });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the user",
    });
    setMessage('');
  };

  const handleSendReminder = () => {
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the user",
    });
  };

  const handleReportTransaction = () => {
    navigate('/dispute', { 
      state: { 
        tradeId: request?.id,
        type: 'merchant_report'
      }
    });
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Trade request not found</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center">
          <button onClick={() => navigate('/trade-requests')}>
            <ArrowLeft size={24} className="text-foreground mr-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Active Trade</h1>
            <p className="text-sm text-muted-foreground">#{request.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Time remaining</p>
          <p className="font-mono font-semibold text-foreground">{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-4 bg-muted/30 border-b">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'payment' ? 'bg-brand text-brand-foreground' : 'bg-success text-success-foreground'
            }`}>
              <span className="text-sm font-semibold">1</span>
            </div>
            <span className="ml-2 text-sm font-medium">Send Payment</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${step !== 'payment' ? 'bg-success' : 'bg-border'}`}></div>
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'waiting' ? 'bg-brand text-brand-foreground' : 
              step === 'completed' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="text-sm font-semibold">2</span>
            </div>
            <span className="ml-2 text-sm font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Trade Summary */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Trade Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">You Send</p>
              <p className="font-bold text-lg text-foreground">₦{request.nairaAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">You Receive</p>
              <p className="font-bold text-lg text-success">{request.amount} {request.coin}</p>
            </div>
          </div>
        </div>

        {step === 'payment' && (
          <>
            {/* Bank Details */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Send Payment To</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-semibold text-foreground">{userBankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-mono font-semibold text-foreground">{userBankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name</span>
                  <span className="font-semibold text-foreground">{userBankDetails.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg text-foreground">₦{request.nairaAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Upload Proof */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Upload Proof of Payment</h3>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
                  proofUploaded 
                    ? 'border-success bg-success/10' 
                    : 'border-border hover:border-brand hover:bg-brand/5'
                }`}
                onClick={handleUploadProof}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  proofUploaded ? 'bg-success/20' : 'bg-muted'
                }`}>
                  {proofUploaded ? (
                    <CheckCircle size={24} className="text-success" />
                  ) : (
                    <Upload size={24} className="text-muted-foreground" />
                  )}
                </div>
                <h4 className={`font-medium text-center mb-2 ${proofUploaded ? 'text-success' : 'text-foreground'}`}>
                  {proofUploaded ? 'Proof Uploaded!' : 'Upload Payment Receipt'}
                </h4>
                <p className={`text-sm text-center ${proofUploaded ? 'text-success/80' : 'text-muted-foreground'}`}>
                  {proofUploaded ? 'Receipt uploaded successfully' : 'Screenshot or photo from gallery/camera'}
                </p>
              </div>

              <Button
                onClick={handleMarkAsPaid}
                className="w-full mt-4"
                disabled={!proofUploaded}
              >
                Mark as Paid
              </Button>
            </div>
          </>
        )}

        {step === 'waiting' && (
          <>
            {/* Waiting for Confirmation */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
              <div className="text-center">
                <Clock size={32} className="text-orange-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Waiting for Confirmation</h3>
                <p className="text-sm text-orange-800">
                  The user will confirm receipt of your payment. Once confirmed, crypto will be released to you.
                </p>
              </div>
            </div>

            {/* Send Reminder */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleSendReminder}
                  variant="outline"
                  className="w-full"
                >
                  <Clock size={16} className="mr-2" />
                  Send Payment Reminder
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Message User */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Message User</h3>
          <div className="space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to the user..."
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-full"
            >
              <MessageCircle size={16} className="mr-2" />
              Send Message
            </Button>
          </div>
        </div>

        {/* Report Transaction */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Need Help?</h3>
          <div className="space-y-3">
            <Button
              onClick={handleReportTransaction}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Flag size={16} className="mr-2" />
              Report Transaction
            </Button>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Important:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Send the exact amount: ₦{request.nairaAmount.toLocaleString()}</li>
            <li>• Upload payment proof immediately after sending</li>
            <li>• Crypto will be released once user confirms payment</li>
            <li>• Contact support if there are any issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MerchantTradeFlow;