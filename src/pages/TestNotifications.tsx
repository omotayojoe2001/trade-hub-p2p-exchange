import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bell, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const TestNotifications = () => {
  const { user } = useAuth();
  const { sendNotification } = usePushNotifications();
  const { toast } = useToast();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test push notification!');
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to send notifications",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const success = await sendNotification(user.id, title, message);
      if (success) {
        toast({
          title: "Notification Sent!",
          description: "Check your device for the push notification",
        });
      } else {
        toast({
          title: "Failed to Send",
          description: "Make sure you've enabled notifications first",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const quickTests = [
    { title: "New Trade Request", message: "You have a new trade offer for $500 BTC" },
    { title: "Payment Received", message: "Payment of ₦825,000 has been confirmed" },
    { title: "Message Received", message: "You have a new message from John Doe" },
    { title: "Trade Completed", message: "Your BTC trade has been completed successfully" }
  ];

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to="/" className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Test Push Notifications</h1>
      </div>

      {/* Custom Test */}
      <Card className="p-4 mb-6">
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold">Send Custom Notification</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
            />
          </div>
          
          <Button
            onClick={handleSendTest}
            disabled={sending || !title || !message}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </div>
      </Card>

      {/* Quick Tests */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Quick Test Notifications</h2>
        <div className="space-y-3">
          {quickTests.map((test, index) => (
            <Button
              key={index}
              onClick={() => {
                setTitle(test.title);
                setMessage(test.message);
                setTimeout(() => handleSendTest(), 100);
              }}
              variant="outline"
              className="w-full text-left justify-start"
              disabled={sending}
            >
              <div>
                <div className="font-medium">{test.title}</div>
                <div className="text-sm text-gray-500">{test.message}</div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📱 How to Test:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Make sure you've enabled notifications on the homepage</li>
          <li>2. Click any test button above</li>
          <li>3. Your phone should vibrate and show the notification</li>
          <li>4. Works even when the app is closed!</li>
        </ol>
      </Card>
    </div>
  );
};

export default TestNotifications;