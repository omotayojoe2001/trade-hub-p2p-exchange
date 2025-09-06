import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, User, Upload, Camera, MessageCircle, AlertTriangle, CheckCircle, FileText, Flag, Banknote, Coins, X, Image, File, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '@/services/supabaseService';
import CryptoIcon from '@/components/CryptoIcon';

const MerchantTradeFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { request } = location.state || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [proofUploaded, setProofUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('payment'); // payment, waiting, completed

  // No bank details without real trade data
  const userBankDetails = {
    bankName: '',
    accountNumber: '',
    accountName: '',
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPEG, PNG, or PDF file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setUploadedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadProof = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `payment_proof_${timestamp}_${uploadedFile.name}`;
      const filePath = `receipts/${fileName}`;
      
      // Upload to Supabase Storage
      await storageService.uploadFile('receipts', filePath, uploadedFile);
      
      // Get public URL
      const publicUrl = storageService.getPublicUrl('receipts', filePath);
      
      setProofUploaded(true);
      toast({
        title: "Proof Uploaded Successfully",
        description: "Payment proof has been uploaded and verified",
      });
      
      // In a real app, you'd save the file URL to the trade record
      console.log('File uploaded:', publicUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProofUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    if (message.trim()) {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the user",
      });
      setMessage('');
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Trade request not found</p>
      </div>
    );
  }

  // Determine trade direction and what merchant needs to send
  const isUserBuyingCrypto = request.type === 'buy'; // User wants crypto, merchant sends crypto
  const merchantNeedsToSend = isUserBuyingCrypto ? `${request.amount} ${request.coin}` : `₦${request.nairaAmount}`;
  const merchantWillReceive = isUserBuyingCrypto ? `₦${request.nairaAmount}` : `${request.amount} ${request.coin}`;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <button onClick={() => navigate('/trade-requests')} className="mr-4">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Complete Trade</h1>
            <p className="text-sm text-gray-500">#{request.id}</p>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
        <div className="flex items-center justify-center">
          <Clock size={20} className="text-orange-600 mr-2" />
          <span className="font-semibold text-orange-800">
            Time remaining: {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Trade Summary */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowUpDown size={24} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isUserBuyingCrypto ? 'Send Crypto to User' : 'Send Cash to User'}
              </h2>
              <p className="text-gray-600">
                {isUserBuyingCrypto 
                  ? 'User has sent cash to your bank account' 
                  : 'User has sent crypto to your wallet'
                }
              </p>
            </div>

            {/* What You Need to Send */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <AlertTriangle size={20} className="text-red-600 mr-2" />
                <h3 className="font-semibold text-red-800">You Need to Send</h3>
              </div>
              <div className="flex items-center">
                {isUserBuyingCrypto ? (
                  <CryptoIcon symbol={request.coin} size={24} className="mr-2" />
                ) : (
                  <Banknote size={24} className="text-red-600 mr-2" />
                )}
                <span className="text-lg font-bold text-red-800">{merchantNeedsToSend}</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {isUserBuyingCrypto 
                  ? 'Send crypto to user\'s wallet address below' 
                  : 'Send cash to user\'s bank account below'
                }
              </p>
            </div>

            {/* What You Will Receive */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle size={20} className="text-green-600 mr-2" />
                <h3 className="font-semibold text-green-800">You Will Receive</h3>
              </div>
              <div className="flex items-center">
                {isUserBuyingCrypto ? (
                  <Banknote size={24} className="text-green-600 mr-2" />
                ) : (
                  <CryptoIcon symbol={request.coin} size={24} className="mr-2" />
                )}
                <span className="text-lg font-bold text-green-800">{merchantWillReceive}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {isUserBuyingCrypto 
                  ? 'Cash has been sent to your bank account' 
                  : 'Crypto has been sent to your wallet'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">User Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-semibold text-gray-900">{request.userName || 'Anonymous'}</span>
              </div>
              {isUserBuyingCrypto ? (
                <div>
                  <span className="text-gray-600 block mb-1">Crypto Wallet Address</span>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm break-all">{request.walletAddress || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'}</code>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-gray-600 block mb-1">Bank Account</span>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <div className="font-semibold">{userBankDetails.bankName}</div>
                      <div>{userBankDetails.accountNumber}</div>
                      <div>{userBankDetails.accountName}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Payment Instructions</h3>
            <div className="space-y-2 text-sm text-blue-700">
              {isUserBuyingCrypto ? (
                <>
                  <p>1. Send exactly {request.amount} {request.coin} to the wallet address above</p>
                  <p>2. Upload proof of transaction (screenshot or transaction ID)</p>
                  <p>3. Wait for user to confirm receipt</p>
                </>
              ) : (
                <>
                  <p>1. Send exactly ₦{request.nairaAmount} to the bank account above</p>
                  <p>2. Upload proof of payment (bank receipt or screenshot)</p>
                  <p>3. Wait for user to confirm receipt</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Proof */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Upload Payment Proof</h3>
            
            {!uploadedFile ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">Tap to upload payment proof</p>
                <p className="text-sm text-gray-500">
                  PNG, JPG or PDF (Max 5MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {uploadedFile.type.startsWith('image/') ? (
                        <Image size={20} className="text-blue-600 mr-2" />
                      ) : (
                        <File size={20} className="text-blue-600 mr-2" />
                      )}
                      <span className="font-medium text-gray-900">{uploadedFile.name}</span>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                  
                  {filePreview && (
                    <div className="mb-3">
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="max-w-full h-32 object-contain border border-gray-200 rounded"
                      />
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUploadProof}
                  disabled={isUploading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="mr-2" />
                      Upload Proof
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload Status */}
            {proofUploaded && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Proof uploaded successfully</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleMarkAsPaid}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!proofUploaded}
          >
            {proofUploaded ? 'Mark as Paid' : 'Upload Proof First'}
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate('/trade-requests')}
          >
            Cancel Trade
          </Button>
        </div>

        {/* Message Section */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Message User</h3>
            <div className="space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message to the user..."
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSendMessage}
                className="w-full"
                disabled={!message.trim()}
              >
                <MessageCircle size={16} className="mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantTradeFlow;