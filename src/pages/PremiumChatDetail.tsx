import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Crown, Send, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read';
}

const PremiumChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m interested in your BTC trade offer.',
      timestamp: '10:30 AM',
      isOwn: false,
      status: 'read'
    },
    {
      id: '2',
      text: 'Hello! Yes, it\'s still available. The rate is ₦150,000,000 per BTC.',
      timestamp: '10:32 AM',
      isOwn: true,
      status: 'read'
    },
    {
      id: '3',
      text: 'Perfect! I\'d like to buy 0.05 BTC. Can we proceed?',
      timestamp: '10:35 AM',
      isOwn: false,
      status: 'read'
    },
    {
      id: '4',
      text: 'Absolutely! As a premium user, you get priority processing. Let me initiate the trade.',
      timestamp: '10:36 AM',
      isOwn: true,
      status: 'delivered'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        status: 'sent'
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
      
      toast({
        title: "Message Sent",
        description: "Your premium message has been delivered",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock conversation data
  const conversation = {
    id: id,
    name: 'Sarah Wilson',
    avatar: 'SW',
    status: 'online',
    tradeType: 'BTC Trade',
    isPremium: true
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-messages" className="mr-3">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{conversation.avatar}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900">{conversation.name}</h1>
                  <Crown size={16} className="text-yellow-500" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{conversation.status}</span>
                  <span className="text-xs text-gray-500">• {conversation.tradeType}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Phone size={20} className="text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Video size={20} className="text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical size={20} className="text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Chat Notice */}
      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-b border-yellow-200 px-4 py-2">
        <div className="flex items-center justify-center space-x-2">
          <Crown size={16} className="text-yellow-600" />
          <span className="text-sm text-yellow-800 font-medium">Premium Chat - Enhanced Security & Priority Support</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.isOwn
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <div className={`flex items-center justify-between mt-1 ${
                msg.isOwn ? 'text-yellow-100' : 'text-gray-500'
              }`}>
                <span className="text-xs">{msg.timestamp}</span>
                {msg.isOwn && (
                  <span className="text-xs">
                    {msg.status === 'sent' && '✓'}
                    {msg.status === 'delivered' && '✓✓'}
                    {msg.status === 'read' && '✓✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2">
            <Paperclip size={20} className="text-gray-600" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your premium message..."
              className="pr-12 border-yellow-200 focus:border-yellow-400"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white p-3"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumChatDetail;
