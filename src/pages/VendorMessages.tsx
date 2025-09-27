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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile-first design */}
      <div className="md:hidden">
        {!selectedJobId ? (
          /* Conversations List - Mobile */
          <>
            <div className="bg-blue-600 text-white p-4">
              <h1 className="text-lg font-semibold">Messages</h1>
              <p className="text-blue-100 text-sm">Customer conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.job_id}
                    onClick={() => setSelectedJobId(conversation.job_id)}
                    className="w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{conversation.job_details.customer_name}</p>
                          {conversation.unread_count > 0 && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ml-2">
                              <span className="text-xs text-white">{conversation.unread_count}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">${conversation.job_details.amount_usd} • {conversation.job_details.delivery_type}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.messages.length > 0 
                            ? conversation.messages[conversation.messages.length - 1].message
                            : 'No messages yet'
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          /* Chat View - Mobile */
          <div className="flex flex-col h-screen">
            {/* Chat Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center space-x-3">
              <button onClick={() => setSelectedJobId('')} className="text-white">
                ←
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedConversation?.job_details.customer_name}</p>
                <p className="text-blue-100 text-sm">${selectedConversation?.job_details.amount_usd}</p>
              </div>
              {selectedConversation?.job_details.customer_phone && (
                <a href={`tel:${selectedConversation.job_details.customer_phone}`} className="text-white">
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {selectedConversation?.messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-16">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Start the conversation!</p>
                </div>
              ) : (
                selectedConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'vendor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        message.sender_type === 'vendor'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_type === 'vendor' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 rounded-full border-gray-300"
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex h-screen">
        {/* Same desktop layout but hidden on mobile */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="bg-blue-600 text-white p-4">
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          {/* Desktop conversations list */}
        </div>
        <div className="flex-1 flex flex-col">
          {/* Desktop chat area */}
        </div>
      </div>

      {error && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Bottom Navigation - only show on conversations list */}
      {!selectedJobId && <VendorBottomNavigation />}
    </div>
  );
};

export default VendorMessages;
