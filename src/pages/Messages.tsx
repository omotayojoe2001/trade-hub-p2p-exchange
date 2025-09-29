import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, User, Send, Paperclip, Image, FileText, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BottomNavigation from '@/components/BottomNavigation';
import { messagingService, type Conversation, type Message } from '@/services/messagingService';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
    
    // Request notification permission
    notificationService.requestPermission();
    
    // Subscribe to conversation updates for real-time inbox updates
    if (user?.id) {
      const channel = messagingService.subscribeToConversations(user.id, () => {
        loadConversations();
      });
      
      return () => channel.unsubscribe();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      
      // Subscribe to new messages
      const channel = messagingService.subscribeToMessages(selectedConversation.id, (newMessage) => {
        setMessages(prev => {
          // Replace temp message with real one, or add new message
          const tempIndex = prev.findIndex(m => 
            m.id.startsWith('temp-') && 
            m.content === newMessage.content && 
            m.sender_id === newMessage.sender_id
          );
          
          if (tempIndex !== -1) {
            // Replace temp message with real one
            const updated = [...prev];
            updated[tempIndex] = newMessage;
            return updated;
          }
          
          // Check if real message already exists
          if (prev.find(m => m.id === newMessage.id)) {
            return prev;
          }
          
          // Add new message
          return [...prev, newMessage];
        });
      });

      return () => {
        console.log('Unsubscribing from messages');
        channel.unsubscribe();
      };
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await messagingService.getConversations();
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await messagingService.getMessages(conversationId);
      if (error) throw error;
      setMessages(data || []);
      
      // Mark messages as read
      await messagingService.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Optimistic update - add message immediately to UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: user?.id || '',
      content: messageContent,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const { data, error } = await messagingService.sendMessage(
        selectedConversation.id,
        messageContent
      );

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageContent);
        console.error('Error sending message:', error);
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent);
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    
    // Determine message type based on file type
    let messageType: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) messageType = 'image';
    else if (file.type.startsWith('video/')) messageType = 'video';

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: user?.id || '',
      content: file.name,
      message_type: messageType,
      is_read: false,
      created_at: new Date().toISOString(),
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type
    };
    
    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('Starting file upload process...');
      
      // Upload file
      const { data: uploadData, error: uploadError } = await messagingService.uploadFile(file);
      if (uploadError) {
        console.error('Upload failed:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded, sending message...');

      // Send message with file URL
      const { data, error } = await messagingService.sendMessage(
        selectedConversation.id,
        file.name,
        messageType,
        uploadData?.url,
        file.name,
        file.size,
        file.type
      );

      if (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        alert('Failed to send file: ' + (error.message || 'Unknown error'));
      } else {
        console.log('File message sent successfully');
      }
    } catch (error: any) {
      console.error('File upload process failed:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Failed to upload file: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === user?.id;
    const isPending = message.id.startsWith('temp-');

    if (message.message_type === 'image' && message.file_url) {
      return (
        <div className={`max-w-[75%] rounded-lg overflow-hidden ${
          isOwn ? (isPending ? 'opacity-70' : '') : ''
        }`}>
          <img 
            src={message.file_url} 
            alt={message.file_name}
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '300px' }}
          />
          <div className={`px-3 py-2 ${
            isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
          }`}>
            <p className={`text-xs ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(message.created_at)}
              {isPending && isOwn && (
                <span className="w-2 h-2 bg-current rounded-full animate-pulse ml-1 inline-block" />
              )}
            </p>
          </div>
        </div>
      );
    }

    if (message.message_type === 'video' && message.file_url) {
      return (
        <div className={`max-w-[75%] rounded-lg overflow-hidden ${
          isOwn ? (isPending ? 'opacity-70' : '') : ''
        }`}>
          <video 
            src={message.file_url} 
            controls
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '300px' }}
          />
          <div className={`px-3 py-2 ${
            isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
          }`}>
            <p className={`text-xs ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(message.created_at)}
              {isPending && isOwn && (
                <span className="w-2 h-2 bg-current rounded-full animate-pulse ml-1 inline-block" />
              )}
            </p>
          </div>
        </div>
      );
    }

    if (message.message_type === 'file' && message.file_url) {
      return (
        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
          isOwn
            ? isPending 
              ? 'bg-blue-400 text-white opacity-70'
              : 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <div className="flex-1">
              <a 
                href={message.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium underline"
              >
                {message.file_name}
              </a>
              <p className="text-xs opacity-75">
                {message.file_size ? `${(message.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
              </p>
            </div>
          </div>
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(message.created_at)}
            {isPending && isOwn && (
              <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
            )}
          </p>
        </div>
      );
    }

    // Text message
    return (
      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
        isOwn
          ? isPending 
            ? 'bg-blue-400 text-white opacity-70'
            : 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="text-sm">{message.content}</p>
        <p className={`text-xs mt-1 flex items-center gap-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTime(message.created_at)}
          {isPending && isOwn && (
            <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
          )}
        </p>
      </div>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Show conversation list
  if (!selectedConversation) {
    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center">
            <Link to="/home" className="mr-3">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          </div>
        </div>

        <div className="">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
              <p className="text-gray-600 mb-4">
                Your trade messages will appear here when you start trading.
              </p>
              <Button asChild>
                <Link to="/buy-sell">Start Trading</Link>
              </Button>
            </div>
          ) : (
            conversations.map((conversation) => {
              const contextLabel = {
                crypto_trade: 'Crypto Trade',
                cash_delivery: 'Cash Delivery',
                trade_request: 'Trade Request'
              }[conversation.context_type];

              return (
                <div 
                  key={conversation.id} 
                  className="border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {conversation.other_user?.display_name || 'User'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.last_message_at)}
                          </p>
                          {conversation.unread_count && conversation.unread_count > 0 && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-1 ml-auto">
                              <span className="text-xs text-white font-medium">
                                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 mt-2 inline-block">
                        {contextLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <BottomNavigation />
      </div>
    );
  }

  // Show individual conversation
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConversation(null)}
            className="mr-3 p-1"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {selectedConversation.other_user?.display_name || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {selectedConversation.context_type.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              {renderMessage(message)}
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="px-2"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={sending || uploading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || uploading}
            size="sm"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        {uploading && (
          <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Uploading file...
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;