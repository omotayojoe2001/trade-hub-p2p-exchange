import React, { useState } from 'react';
import { ArrowLeft, Download, Star, MessageSquare, Shield, CheckCircle, Share2, Twitter, Facebook, Copy, Receipt, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import CryptoIcon from '@/components/CryptoIcon';
import { shareTradeToSocial, trackReferralShare, ShareableTradeData } from '@/services/referralService';

const TradeCompleted = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Get trade data from location state or use default
  const tradeData = location.state || {
    tradeId: `TXN-${Date.now()}`,
    date: new Date().toLocaleString(),
    amountSold: '0.001',
    coin: 'BTC',
    rate: '₦1,500,000/BTC',
    totalReceived: '₦1,500',
    platformFee: '₦7.50',
    netAmount: '₦1,492.50',
    merchant: 'Demo Merchant',
    bankAccount: 'Demo Bank Account',
    status: 'completed'
  };

  // Ensure all values are defined for the receipt
  const safeTradeData = {
    tradeId: tradeData.tradeId || `TXN-${Date.now()}`,
    date: tradeData.date || new Date().toLocaleString(),
    amountSold: tradeData.amountSold || '0.001',
    coin: tradeData.coin || 'BTC',
    rate: tradeData.rate || '₦1,500,000/BTC',
    totalReceived: tradeData.totalReceived || '₦1,500',
    platformFee: tradeData.platformFee || '₦7.50',
    netAmount: tradeData.netAmount || '₦1,492.50',
    merchant: tradeData.merchant || 'Central Exchange',
    bankAccount: tradeData.bankAccount || 'Demo Trade',
    status: tradeData.status || 'completed'
  };

  const handleRateMerchant = () => {
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Rating Submitted",
      description: `Thank you for your ${rating}-star rating!`,
    });
    setShowRatingModal(false);
    setRating(0);
  };

  const handleLeaveFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback!",
    });
    setShowFeedbackModal(false);
    setFeedback('');
  };

  const handleDownloadReceipt = () => {
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Trade Receipt - Central Exchange</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 30px; 
                background: #f8f9fa;
            }
            .receipt { 
                background: white; 
                padding: 30px; 
                border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
                text-align: center; 
                border-bottom: 3px solid #2563eb; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
            }
            .header h1 { 
                color: #2563eb; 
                margin: 0; 
                font-size: 28px;
            }
            .header p { 
                color: #6b7280; 
                margin: 5px 0 0 0;
            }
            .section { 
                margin: 25px 0; 
            }
            .section-title { 
                font-size: 18px; 
                font-weight: bold; 
                color: #374151; 
                margin-bottom: 15px; 
                padding-bottom: 8px; 
                border-bottom: 2px solid #e5e7eb;
            }
            .row { 
                display: flex; 
                justify-content: space-between; 
                margin: 12px 0; 
                padding: 10px 0; 
            }
            .row:not(:last-child) { 
                border-bottom: 1px solid #f3f4f6; 
            }
            .label { 
                font-weight: 600; 
                color: #4b5563;
            }
            .value { 
                font-weight: 500; 
                color: #111827;
            }
            .success { 
                color: #059669; 
                font-weight: bold; 
                font-size: 18px;
            }
            .total-row { 
                background: #f0f9ff; 
                padding: 15px; 
                border-radius: 8px; 
                margin: 20px 0;
            }
            .footer { 
                text-align: center; 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 2px solid #e5e7eb; 
                color: #6b7280;
            }
            .status-badge { 
                background: #dcfce7; 
                color: #166534; 
                padding: 6px 12px; 
                border-radius: 20px; 
                font-size: 14px; 
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="receipt">
            <div class="header">
                <h1>Trade Receipt</h1>
                <p>Central Exchange P2P Platform</p>
                <div style="margin-top: 15px;">
                    <span class="status-badge">✓ COMPLETED</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Transaction Details</div>
                <div class="row">
                    <span class="label">Transaction ID:</span>
                    <span class="value" style="font-family: monospace;">${safeTradeData.tradeId}</span>
                </div>
                <div class="row">
                    <span class="label">Date & Time:</span>
                    <span class="value">${safeTradeData.date}</span>
                </div>
                <div class="row">
                    <span class="label">Trade Type:</span>
                    <span class="value">Sell Crypto</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Trade Summary</div>
                <div class="row">
                    <span class="label">Amount Sold:</span>
                    <span class="value">${safeTradeData.amountSold} ${safeTradeData.coin}</span>
                </div>
                <div class="row">
                    <span class="label">Exchange Rate:</span>
                    <span class="value">${safeTradeData.rate}</span>
                </div>
                <div class="row">
                    <span class="label">Gross Amount:</span>
                    <span class="value">${safeTradeData.totalReceived}</span>
                </div>
                <div class="row">
                    <span class="label">Platform Fee (0.5%):</span>
                    <span class="value">${safeTradeData.platformFee}</span>
                </div>
                <div class="total-row">
                    <div class="row" style="margin: 0; padding: 0; border: none;">
                        <span class="label" style="font-size: 18px;">Net Amount Received:</span>
                        <span class="success">${safeTradeData.netAmount}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Merchant Information</div>
                <div class="row">
                    <span class="label">Merchant:</span>
                    <span class="value">${safeTradeData.merchant}</span>
                </div>
                <div class="row">
                    <span class="label">Payment Method:</span>
                    <span class="value">${safeTradeData.bankAccount}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Security Information</div>
                <div class="row">
                    <span class="label">Escrow Status:</span>
                    <span class="value" style="color: #059669;">✓ Funds Released</span>
                </div>
                <div class="row">
                    <span class="label">Payment Verified:</span>
                    <span class="value" style="color: #059669;">✓ Confirmed</span>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Thank you for using Central Exchange!</strong></p>
                <p>This receipt serves as proof of your completed transaction.</p>
                <p style="font-size: 12px; margin-top: 20px;">Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${safeTradeData.tradeId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Professional receipt saved as HTML file.",
    });
  };

  const handleShare = (platform: string) => {
    const shareableData: ShareableTradeData = {
      tradeId: safeTradeData.tradeId,
      amount: safeTradeData.amountSold,
      coin: safeTradeData.coin,
      status: safeTradeData.status,
      date: safeTradeData.date,
      merchant: safeTradeData.merchant,
      totalValue: safeTradeData.netAmount
    };

    if (platform === 'copy') {
      shareTradeToSocial('copy', shareableData, true);
      toast({
        title: "Copied to Clipboard",
        description: "Trade details with referral link copied to clipboard!",
      });
    } else {
      shareTradeToSocial(platform, shareableData, true);
    }

    // Track the share for analytics
    trackReferralShare(platform, safeTradeData.tradeId);

    toast({
      title: "Shared Successfully",
      description: `Trade shared to ${platform} with your referral link!`,
    });
  };

  const handleCopyTradeId = () => {
    navigator.clipboard.writeText(safeTradeData.tradeId);
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard.",
    });
  };

  const handleNewTrade = () => {
    navigate('/buy-sell');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <Link to="/home" className="mr-4">
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Trade Completed</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Animation */}
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trade Completed Successfully!</h2>
          <p className="text-gray-600">
            Your crypto has been sent and payment has been confirmed.
          </p>
        </div>

        {/* Trade Summary Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trade Summary</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">ID:</span>
                <span className="text-sm font-mono text-gray-900">{safeTradeData.tradeId}</span>
                <button onClick={handleCopyTradeId} className="p-1 hover:bg-gray-100 rounded">
                  <Copy size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CryptoIcon symbol={safeTradeData.coin} size={24} className="mr-2" />
                  <span className="text-gray-600">Amount Sold</span>
                </div>
                <span className="font-semibold text-gray-900">{safeTradeData.amountSold} {safeTradeData.coin}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Rate</span>
                <span className="font-semibold text-gray-900">{safeTradeData.rate}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total Received</span>
                <span className="font-semibold text-gray-900">{safeTradeData.totalReceived}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="text-gray-900">{safeTradeData.platformFee}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Net Amount</span>
                  <span className="font-bold text-lg text-green-600">{safeTradeData.netAmount}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Merchant</span>
                <span className="font-semibold text-gray-900">{safeTradeData.merchant}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">{safeTradeData.date}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleDownloadReceipt}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download size={20} className="mr-2" />
            Download Receipt
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleRateMerchant}
              variant="outline"
              className="h-12"
            >
              <Star size={20} className="mr-2" />
              Rate Merchant
            </Button>
            <Button 
              onClick={handleLeaveFeedback}
              variant="outline"
              className="h-12"
            >
              <MessageSquare size={20} className="mr-2" />
              Leave Feedback
            </Button>
          </div>

          <Button 
            onClick={handleNewTrade}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            Start New Trade
          </Button>
        </div>

        {/* Share Section */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Share Your Success & Earn Rewards</h4>
            <p className="text-sm text-gray-600 mb-4">Share your successful trade and invite friends with your referral link to earn rewards!</p>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Twitter size={20} className="text-blue-600 mb-1" />
                <span className="text-xs text-blue-600">Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Facebook size={20} className="text-blue-600 mb-1" />
                <span className="text-xs text-blue-600">Facebook</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-green-600 mb-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="text-xs text-green-600">WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Send size={20} className="text-blue-600 mb-1" />
                <span className="text-xs text-blue-600">Telegram</span>
              </button>
            </div>

            <Button
              onClick={() => handleShare('copy')}
              variant="outline"
              className="w-full mt-3"
            >
              <Copy size={16} className="mr-2" />
              Copy Message with Referral Link
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Shield size={20} className="text-green-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">Trade Secured</h4>
                <p className="text-green-700 text-sm">
                  This trade was completed using our secure escrow system. Your transaction details have been recorded for your security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Experience</h3>
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-full transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star size={24} className={star <= rating ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowRatingModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Feedback</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 mb-4"
            />
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowFeedbackModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCompleted;