import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';
import { messagingService, type Message, type Conversation } from '@/services/messagingService';
import { useToast } from '@/hooks/use-toast';

interface MessageThreadProps {
  otherUserId: string;
  otherUserName: string;
  tradeId?: string;
  cashTradeId?: string;
  tradeRequestId?: string;
  contextType?: 'crypto_trade' | 'cash_delivery' | 'trade_request';
  isOpen: boolean;
  onClose: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  otherUserId,
  otherUserName,
  tradeId,
  cashTradeId,
  tradeRequestId,
  contextType = 'crypto_trade',
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && otherUserId) {
      initializeConversation();
    }
  }, [isOpen, otherUserId, tradeId, cashTradeId, tradeRequestId]);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      
      // Subscribe to new messages
      const channel = messagingService.subscribeToMessages(conversation.id, (newMessage) => {
        console.log('📨 Adding new message to UI:', newMessage);
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        scrollToBottom();
      });

      return () => {
        console.log('🔌 Unsubscribing from messages');
        channel.unsubscribe();
      };
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    setLoading(true);
    try {
      const { data, error } = await messagingService.getOrCreateConversation(
        otherUserId,
        tradeId,
        cashTradeId,
        tradeRequestId,
        contextType
      );

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      const { data, error } = await messagingService.getMessages(conversation.id);
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark messages as read
      await messagingService.markMessagesAsRead(conversation.id);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      const { data, error } = await messagingService.sendMessage(
        conversation.id,
        newMessage.trim()
      );

      if (error) throw error;
      
      setNewMessage('');
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-[95vw] max-w-md h-[80vh] max-h-[500px] flex flex-col shadow-xl">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Chat with {otherUserName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-6">
                  <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-2 py-1.5 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-xs leading-relaxed">{message.content}</p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 text-sm h-8"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageThread;