import React, { useState, useEffect } from 'react';
import { Crown, MessageCircle, Search, Star, Clock, Shield, Send, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  trade_id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_premium: boolean;
  rating?: number;
}

const PremiumMessages = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();

      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('user-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          fetchConversations(); // Refresh conversations when new message arrives
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all trades where user is involved
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          id,
          buyer_id,
          seller_id,
          status,
          created_at
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (tradesError) throw tradesError;

      if (!trades || trades.length === 0) {
        setConversations([]);
        return;
      }

      // Get latest message for each trade
      const conversationsData: Conversation[] = [];

      for (const trade of trades) {
        const otherUserId = trade.buyer_id === user.id ? trade.seller_id : trade.buyer_id;

        // Get latest message for this trade
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('trade_id', trade.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          continue;
        }

        // Get other user's profile
        const { data: otherUserProfile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, user_type')
          .eq('user_id', otherUserId)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          continue;
        }

        // Get unread count
        const { count: unreadCount, error: unreadError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('trade_id', trade.id)
          .eq('receiver_id', user.id)
          .eq('read', false);

        if (unreadError) {
          console.error('Error fetching unread count:', unreadError);
        }

        const lastMessage = messages && messages.length > 0 ? messages[0] : null;

        conversationsData.push({
          id: trade.id,
          trade_id: trade.id,
          other_user_id: otherUserId,
          other_user_name: otherUserProfile?.display_name || 'User',
          last_message: lastMessage?.content || 'No messages yet',
          last_message_time: lastMessage?.created_at || trade.created_at,
          unread_count: unreadCount || 0,
          is_premium: otherUserProfile?.user_type === 'premium',
          rating: 5.0 // Default rating for now
        });
      }

      setConversations(conversationsData);

    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
  };

  const handleConversationClick = (conversation: any) => {
    // Navigate to premium chat detail page
    navigate(`/premium-chat/${conversation.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageCircle size={24} className="mr-2 text-gray-600" />
              Messages
            </h1>
            <p className="text-gray-600 text-sm">Secure communication with premium features</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Premium Benefits */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Shield size={20} className="mr-2 text-gray-600" />
            Premium Messaging Benefits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <MessageCircle size={20} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Priority Support</div>
            </div>
            <div className="text-center">
              <Shield size={20} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Encrypted Chat</div>
            </div>
            <div className="text-center">
              <Phone size={20} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Voice Calls</div>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className="p-4 cursor-pointer transition-all hover:shadow-md bg-white border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-semibold text-gray-600">
                    {conversation.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500`} />
                  {conversation.is_premium && (
                    <Crown size={12} className="absolute -top-1 -right-1 text-yellow-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{conversation.other_user_name}</h4>
                      {conversation.rating && (
                        <div className="flex items-center text-xs text-yellow-600">
                          <Star size={12} className="mr-1 fill-current" />
                          {conversation.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {conversation.unread_count > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                    {conversation.last_message}
                  </p>

                  <div className="flex items-center text-xs text-blue-600">
                    <MessageCircle size={12} className="mr-1" />
                    Trade: {conversation.trade_id}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/premium-support')}
            className="h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <Shield size={16} className="mr-2" />
            Premium Support
          </Button>
          <Button
            variant="outline"
            className="h-12 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <MessageCircle size={16} className="mr-2" />
            New Message
          </Button>
        </div>

        {/* Premium Features */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Premium Communication Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Shield size={20} className="text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Quality Alerts</div>
                  <div className="text-sm text-gray-600">Advanced fraud detection and alerts</div>
                </div>
              </div>
              <Crown size={16} className="text-yellow-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Shield size={20} className="text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Enhanced Security</div>
                  <div className="text-sm text-gray-600">Premium security monitoring</div>
                </div>
              </div>
              <Crown size={16} className="text-yellow-600" />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Clock size={20} className="text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Priority Response</div>
                  <div className="text-sm text-gray-600">Get faster responses from traders</div>
                </div>
              </div>
              <Crown size={16} className="text-yellow-600" />
            </div>
          </div>
        </Card>

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle size={48} className="text-yellow-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-900 mb-2">No conversations found</h3>
            <p className="text-yellow-700">
              {searchTerm ? 'Try adjusting your search terms' : 'Start trading to begin conversations'}
            </p>
          </div>
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumMessages;
