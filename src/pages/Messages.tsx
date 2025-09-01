import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { messageService, realtimeService } from '@/services/supabaseService';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { tradeId, recipientName, message: initialMessage } = location.state || {};
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load messages from Supabase
  useEffect(() => {
    const loadMessages = async () => {
      if (!tradeId || !user) return;
      
      try {
        setLoading(true);
        const dbMessages = await messageService.getMessagesByTrade(tradeId);
        
        // Transform Supabase data to our format
        const transformedMessages = dbMessages.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender_id === user.id ? 'me' : 'user',
          timestamp: new Date(msg.created_at),
          status: msg.read ? 'delivered' : 'sent'
        }));
        
        setMessages(transformedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [tradeId, user, toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!tradeId || !user) return;

    const subscription = realtimeService.subscribeToMessages(tradeId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = {
          id: payload.new.id,
          text: payload.new.content,
          sender: payload.new.sender_id === user.id ? 'me' : 'user',
          timestamp: new Date(payload.new.created_at),
          status: 'sent'
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read if it's from the other user
        if (payload.new.sender_id !== user.id) {
          messageService.markMessagesAsRead(tradeId, user.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [tradeId, user]);

  useEffect(() => {
    if (initialMessage && user) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, user]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || newMessage.trim();
    if (!text || !tradeId || !user) return;

    try {
      // Send message to Supabase
      await messageService.sendMessage({
        trade_id: tradeId,
        sender_id: user.id,
        receiver_id: 'other-user-id', // In real app, get from trade data
        content: text,
        message_type: 'text'
      });

      setNewMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been delivered",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
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