import React, { useState } from 'react';
import { ArrowLeft, Send, Phone, MoreVertical, Shield, Star, Crown } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import BottomNavigation from '@/components/BottomNavigation';

const ChatDetail = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const [message, setMessage] = useState('');

  // Mock chat data - in real app, fetch based on chatId
  const chatData = {
    id: chatId,
    name: 'No chat available',
    avatar: '?',
    status: 'offline',
    rating: 0,
    tradeId: 'N/A',
    isPremium: true
  };

  const messages = [
    {
      id: '1',
      sender: 'other',
      text: 'Hi! I\'m interested in your BTC trade offer.',
      time: '10:30 AM',
      status: 'delivered'
    },
    {
      id: '2',
      sender: 'me',
      text: 'Great! The rate is ₦97,234,500 per BTC. Are you ready to proceed?',
      time: '10:32 AM',
      status: 'read'
    },
    {
      id: '3',
      sender: 'other',
      text: 'Yes, that works for me. How do we proceed with the payment?',
      time: '10:35 AM',
      status: 'delivered'
    },
    {
      id: '4',
      sender: 'me',
      text: 'I\'ll send you the payment details. Please make the transfer and send proof.',
      time: '10:37 AM',
      status: 'read'
    },
    {
      id: '5',
      sender: 'other',
      text: 'Payment confirmed! Thanks for the smooth transaction.',
      time: '10:45 AM',
      status: 'delivered'
    }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully",
    });

    setMessage('');
  };

  const handleVoiceCall = () => {
    toast({
      title: "Voice Call",
      description: "Initiating voice call...",
    });
  };

  return (
    <div className={`min-h-screen ${isPremium ? 'bg-gray-50' : 'bg-white'} pb-20`}>
      {/* Header */}
      <div className={`${isPremium ? 'bg-white border-b border-gray-200' : 'bg-blue-600'} px-4 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isPremium ? "/premium-messages" : "/messages"} className="mr-4">
              <ArrowLeft size={24} className={isPremium ? 'text-gray-600' : 'text-white'} />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {chatData.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                {isPremium && (
                  <Crown size={12} className="absolute -top-1 -right-1 text-yellow-500" />
                )}
              </div>
              <div>
                <h1 className={`font-semibold ${isPremium ? 'text-gray-900' : 'text-white'}`}>
                  {chatData.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${isPremium ? 'text-gray-600' : 'text-blue-100'}`}>
                    {chatData.status}
                  </span>
                  {chatData.rating && (
                    <div className="flex items-center text-xs">
                      <Star size={10} className={`mr-1 fill-current ${isPremium ? 'text-yellow-500' : 'text-yellow-300'}`} />
                      <span className={isPremium ? 'text-gray-600' : 'text-blue-100'}>{chatData.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isPremium && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <Crown size={10} className="mr-1" />
                Premium
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceCall}
              className={isPremium ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-blue-700'}
            >
              <Phone size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={isPremium ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-blue-700'}
            >
              <MoreVertical size={20} />
            </Button>
          </div>
        </div>

        {/* Trade Info */}
        {chatData.tradeId && (
          <div className={`mt-3 p-3 rounded-lg ${isPremium ? 'bg-gray-50 border border-gray-200' : 'bg-blue-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield size={16} className={isPremium ? 'text-gray-600' : 'text-blue-100'} />
                <span className={`text-sm font-medium ${isPremium ? 'text-gray-900' : 'text-white'}`}>
                  Trade: {chatData.tradeId}
                </span>
              </div>
              <Button
                size="sm"
                variant={isPremium ? "outline" : "secondary"}
                onClick={() => navigate(`/trade-details/${chatData.tradeId}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Security Alert */}
      <div className={`mx-4 mt-4 p-3 rounded-lg border ${isPremium ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start space-x-2">
          <Shield size={16} className={`${isPremium ? 'text-red-600' : 'text-yellow-600'} mt-0.5`} />
          <div>
            <div className={`font-medium text-sm ${isPremium ? 'text-red-900' : 'text-yellow-900'}`}>
              Security Alert
            </div>
            <div className={`text-xs ${isPremium ? 'text-red-700' : 'text-yellow-700'}`}>
              Always use the platform for exchanges to avoid being scammed. Never share personal banking details outside the platform.
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'me'
                  ? isPremium
                    ? 'bg-gray-900 text-white'
                    : 'bg-blue-600 text-white'
                  : isPremium
                  ? 'bg-white border border-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${
                  msg.sender === 'me'
                    ? 'text-gray-300'
                    : isPremium
                    ? 'text-gray-500'
                    : 'text-gray-600'
                }`}>
                  {msg.time}
                </span>
                {msg.sender === 'me' && (
                  <span className={`text-xs ${
                    msg.status === 'read' ? 'text-blue-300' : 'text-gray-400'
                  }`}>
                    {msg.status === 'read' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className={`fixed bottom-20 left-0 right-0 p-4 ${isPremium ? 'bg-white border-t border-gray-200' : 'bg-white border-t'}`}>
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className={isPremium ? 'border-gray-200' : ''}
          />
          <Button
            onClick={handleSendMessage}
            className={isPremium ? 'bg-gray-900 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {isPremium ? <PremiumBottomNavigation /> : <BottomNavigation />}
    </div>
  );
};

export default ChatDetail;
