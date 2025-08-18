import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tradeId, recipientName, message: initialMessage } = location.state || {};
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm ready to proceed with the trade",
      sender: 'user',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      status: 'delivered'
    },
    {
      id: 2,
      text: "Great! I'll send the payment to your account now",
      sender: 'me',
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
      status: 'delivered'
    }
  ]);
  
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (initialMessage) {
      const message = {
        id: messages.length + 1,
        text: initialMessage,
        sender: 'me',
        timestamp: new Date(),
        status: 'sent'
      };
      setMessages(prev => [...prev, message]);
      
      toast({
        title: "Message Sent",
        description: "Your message has been delivered",
      });
    }
  }, [initialMessage]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      text: newMessage.trim(),
      sender: 'me',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate auto-reply
      const autoReply = {
        id: messages.length + 2,
        text: "Thanks for the update! I'll check my account.",
        sender: 'user',
        timestamp: new Date(),
        status: 'delivered'
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);

    toast({
      title: "Message Sent",
      description: "Your message has been delivered",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-foreground mr-4" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary font-semibold">
                {recipientName?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {recipientName || 'Trade Partner'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {tradeId ? `Trade #${tradeId}` : 'Active now'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone size={20} />
          </Button>
          <Button variant="ghost" size="sm">
            <Video size={20} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message, index) => {
          const showDate = index === 0 || 
            formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
          
          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === 'me' 
                    ? 'bg-brand text-brand-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    message.sender === 'me' ? 'text-brand-foreground/70' : 'text-muted-foreground'
                  }`}>
                    <span className="text-xs">{formatTime(message.timestamp)}</span>
                    {message.sender === 'me' && (
                      <span className="text-xs">
                        {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground max-w-xs lg:max-w-md px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {/* Trade Info Banner */}
      {tradeId && (
        <div className="p-3 bg-brand/10 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={16} className="text-brand mr-2" />
              <span className="text-sm text-brand font-medium">Active Trade #{tradeId}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="text-brand hover:bg-brand/20"
            >
              Back to Trade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;