import React, { useState } from 'react';
import { ArrowLeft, Download, Star, MessageSquare, Shield, CheckCircle, Share2, Twitter, Facebook, Copy, Receipt } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import CryptoIcon from '@/components/CryptoIcon';

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
    tradeId: 'TXN-20241209-001',
    date: 'Dec 9, 2024, 2:45 PM',
    amountSold: '0.0032',
    coin: 'BTC',
    rate: '₦1,755,000/BTC',
    totalReceived: '₦561,600',
    platformFee: '₦2,808',
    netAmount: '₦558,792',
    merchant: 'MercyPay',
    bankAccount: 'GTBank • • • • 4875',
    status: 'completed'
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
    // Create receipt data
    const receiptContent = `
TRADE RECEIPT - Central Exchange
====================================
Transaction ID: ${tradeData.tradeId}
Date: ${tradeData.date}
Status: ${tradeData.status.toUpperCase()}

TRADE DETAILS
====================================
Amount Sold: ${tradeData.amountSold} ${tradeData.coin}
Rate: ${tradeData.rate}
Total Received: ${tradeData.totalReceived}
Platform Fee: ${tradeData.platformFee}
Net Amount: ${tradeData.netAmount}

MERCHANT DETAILS
====================================
Merchant: ${tradeData.merchant}
Bank Account: ${tradeData.bankAccount}

Thank you for using Central Exchange!
====================================
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${tradeData.tradeId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Your trade receipt has been downloaded successfully.",
    });
  };

  const handleShare = (platform: string) => {
    const shareText = `Just completed a successful ${tradeData.amountSold} ${tradeData.coin} trade on Central Exchange! Transaction ID: ${tradeData.tradeId}`;
    const shareUrl = window.location.origin;
    
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        toast({
          title: "Copied to Clipboard",
          description: "Trade details copied to clipboard!",
        });
        return;
    }
    
    window.open(shareLink, '_blank');
  };

  const handleCopyTradeId = () => {
    navigator.clipboard.writeText(tradeData.tradeId);
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
                <span className="text-sm font-mono text-gray-900">{tradeData.tradeId}</span>
                <button onClick={handleCopyTradeId} className="p-1 hover:bg-gray-100 rounded">
                  <Copy size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CryptoIcon symbol={tradeData.coin} size={24} className="mr-2" />
                  <span className="text-gray-600">Amount Sold</span>
                </div>
                <span className="font-semibold text-gray-900">{tradeData.amountSold} {tradeData.coin}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Rate</span>
                <span className="font-semibold text-gray-900">{tradeData.rate}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total Received</span>
                <span className="font-semibold text-gray-900">{tradeData.totalReceived}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="text-gray-900">{tradeData.platformFee}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Net Amount</span>
                  <span className="font-bold text-lg text-green-600">{tradeData.netAmount}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Merchant</span>
                <span className="font-semibold text-gray-900">{tradeData.merchant}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">{tradeData.date}</span>
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
            <h4 className="font-semibold text-gray-900 mb-3">Share Your Success</h4>
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
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 size={20} className="text-gray-600 mb-1" />
                <span className="text-xs text-gray-600">Copy</span>
              </button>
            </div>
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