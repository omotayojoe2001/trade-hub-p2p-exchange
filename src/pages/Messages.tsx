import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { messageService, realtimeService } from '@/services/supabaseService';
import ClickableUser from '@/components/ClickableUser';
import MessagesList from '@/components/MessagesList';
import BottomNavigation from '@/components/BottomNavigation';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { tradeId, recipientName, message: initialMessage } = location.state || {};

  // If no tradeId, show messages list
  const showMessagesList = !tradeId;

  // Redirect premium users to premium messages
  React.useEffect(() => {
    if (user && isPremium) {
      navigate('/premium-messages');
    }
  }, [user, isPremium, navigate]);
  
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
        message_type: 'text',
        media_url: null,
        read: false
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

  // Show messages list if no specific conversation selected
  if (showMessagesList) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-6 w-6 text-gray-900" />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-gray-900">Messages</h1>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4">
          <MessagesList />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center">
          <button onClick={() => navigate('/messages')}>
            <ArrowLeft size={24} className="text-foreground mr-4" />
          </button>
          <ClickableUser
            userId={location.state?.recipientId || ''}
            displayName={recipientName || 'Trade Partner'}
            userType={location.state?.recipientUserType}
            isMerchant={location.state?.recipientIsMerchant}
            rating={location.state?.recipientRating}
            size="md"
            showRating={false}
            showBadges={true}
            clickable={!!location.state?.recipientId}
          />
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
            onClick={() => handleSendMessage()}
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