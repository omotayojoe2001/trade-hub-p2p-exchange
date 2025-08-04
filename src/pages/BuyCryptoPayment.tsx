import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Copy, AlertCircle, Upload, Send, Paperclip } from "lucide-react";

const BuyCryptoPayment = () => {
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes
  const [isPaid, setIsPaid] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: "merchant", text: "Please send the exact amount to the account details provided.", time: "2:30 PM" },
    { id: 2, sender: "merchant", text: "After payment, please upload your receipt and click 'Mark as Paid'.", time: "2:30 PM" }
  ]);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount } = location.state || {};
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bankDetails = {
    bankName: "GTBank",
    accountNumber: "0123456789",
    accountName: "John Doe",
    reference: "BTC-" + Date.now().toString().slice(-6)
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(bankDetails.reference);
  };

  const handleMarkAsPaid = () => {
    setIsPaid(true);
    navigate("/buy-crypto-waiting", { state: { amount, nairaAmount } });
  };

  const handleSendReminder = () => {
    console.log("Sending reminder to merchant");
  };

  const handleCancel = () => {
    navigate("/buy-crypto-cancel");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "user",
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Payment Instructions</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-orange-800 font-semibold">
                Pay within: {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-orange-700">
              Complete your bank transfer before time expires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bank Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank Name</span>
              <span className="font-semibold">{bankDetails.bankName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Number</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{bankDetails.accountNumber}</span>
                <Button size="sm" variant="ghost" onClick={handleCopyAccount}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-semibold">{bankDetails.accountName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reference</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{bankDetails.reference}</span>
                <Button size="sm" variant="ghost" onClick={handleCopyReference}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Amount to Pay</span>
              <span className="font-bold text-lg">₦{nairaAmount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Important:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Use the exact reference number provided</li>
                  <li>• Transfer the exact amount shown</li>
                  <li>• Upload your payment receipt</li>
                  <li>• Click "Mark as Paid" after transfer</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Payment Proof */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upload Payment Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              onClick={triggerFileUpload}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                {uploadedFile ? uploadedFile.name : "Tap to upload payment receipt"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or PDF (Max 5MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploadedFile && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messaging Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chat with Merchant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-40 overflow-y-auto space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 min-h-[40px] max-h-[80px]"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim()}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={handleMarkAsPaid} 
            className="w-full h-12"
            disabled={!uploadedFile}
          >
            Mark as Paid
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleSendReminder}>
              Send Reminder
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel Trade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyCryptoPayment;