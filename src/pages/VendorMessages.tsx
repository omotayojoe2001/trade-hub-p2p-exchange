import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Phone, User, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import VendorBottomNavigation from '@/components/vendor/VendorBottomNavigation';

interface VendorMessage {
  id: string;
  job_id: string;
  sender_type: string;
  message: string;
  created_at: string;
  job_details?: {
    amount_usd: number;
    delivery_type: string;
    customer_name: string;
    customer_phone: string;
  };
}

interface JobConversation {
  job_id: string;
  job_details: {
    amount_usd: number;
    delivery_type: string;
    customer_name: string;
    customer_phone: string;
    status: string;
  };
  messages: VendorMessage[];
  unread_count: number;
}

const VendorMessages = () => {
  const [conversations, setConversations] = useState<JobConversation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) {
        setError('Vendor ID not found');
        return;
      }

      // Get all jobs for this vendor with customer details
      const { data: jobs, error: jobsError } = await supabase
        .from('vendor_jobs')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // For each job, get customer details and messages
      const conversationsData = await Promise.all(
        (jobs || []).map(async (job) => {
          // Get customer details
          const { data: customer } = await supabase
            .from('profiles')
            .select('display_name, phone_number')
            .eq('user_id', job.premium_user_id)
            .single();

          // Get messages for this job
          const { data: messages } = await supabase
            .from('vendor_messages')
            .select('*')
            .eq('job_id', job.id)
            .order('created_at', { ascending: true });

          return {
            job_id: job.id,
            job_details: {
              amount_usd: job.amount_usd,
              delivery_type: job.delivery_type,
              customer_name: customer?.display_name || 'Customer',
              customer_phone: customer?.phone_number || '',
              status: job.status,
            },
            messages: messages || [],
            unread_count: 0, // Could be calculated based on read_at field
          };
        })
      );

      setConversations(conversationsData);
      if (conversationsData.length > 0 && !selectedJobId) {
        setSelectedJobId(conversationsData[0].job_id);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedJobId) return;

    try {
      setSending(true);
      const vendorUserId = localStorage.getItem('vendor_user_id');
      if (!vendorUserId) {
        throw new Error('Vendor user ID not found');
      }

      const { error } = await supabase
        .from('vendor_messages')
        .insert({
          job_id: selectedJobId,
          sender_type: 'vendor',
          sender_id: vendorUserId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await loadConversations(); // Reload to get the new message
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find(c => c.job_id === selectedJobId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600">Chat with customers about deliveries</p>
          </div>
          <MessageCircle className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.job_id}
                onClick={() => setSelectedJobId(conversation.job_id)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 ${
                  selectedJobId === conversation.job_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{conversation.job_details.customer_name}</span>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">{conversation.unread_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                  <Package className="w-3 h-3" />
                  <span>${conversation.job_details.amount_usd} {conversation.job_details.delivery_type}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {conversation.messages.length > 0 
                    ? conversation.messages[conversation.messages.length - 1].message
                    : 'No messages yet'
                  }
                </p>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{selectedConversation.job_details.customer_name}</h3>
                    <p className="text-sm text-gray-600">
                      ${selectedConversation.job_details.amount_usd} {selectedConversation.job_details.delivery_type}
                    </p>
                  </div>
                  {selectedConversation.job_details.customer_phone && (
                    <a
                      href={`tel:${selectedConversation.job_details.customer_phone}`}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Call</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'vendor' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender_type === 'vendor'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_type === 'vendor' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Bottom Navigation */}
      <VendorBottomNavigation />
    </div>
  );
};

export default VendorMessages;
