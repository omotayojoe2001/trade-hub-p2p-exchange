import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  trade_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: Date;
  unread_count: number;
  trade_type: string;
  coin_type: string;
  amount: number;
}

const MessagesList: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchConversations();
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
          trade_type,
          coin_type,
          amount,
          buyer_id,
          seller_id,
          created_at
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (tradesError) {
        console.error('Error fetching trades:', tradesError);
        return;
      }

      // Get messages for each trade to create conversations
      const conversationsData: Conversation[] = [];

      for (const trade of trades || []) {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('trade_id', trade.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) {
          console.error('Error fetching messages for trade:', trade.id, messagesError);
          continue;
        }

        const lastMessage = messages?.[0];
        const otherUserId = trade.buyer_id === user.id ? trade.seller_id : trade.buyer_id;

        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', otherUserId)
          .single();

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('trade_id', trade.id)
          .eq('read', false)
          .neq('sender_id', user.id);

        conversationsData.push({
          id: `${trade.id}-${otherUserId}`,
          trade_id: trade.id,
          other_user_name: profile?.display_name || 'Unknown User',
          last_message: lastMessage?.content || 'No messages yet',
          last_message_time: lastMessage ? new Date(lastMessage.created_at) : new Date(trade.created_at),
          unread_count: unreadCount || 0,
          trade_type: trade.trade_type,
          coin_type: trade.coin_type,
          amount: trade.amount
        });
      }

      setConversations(conversationsData);

    } catch (error) {
      console.error('Error in fetchConversations:', error);
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
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleConversationClick = (conversation: Conversation) => {
    navigate('/messages', {
      state: {
        tradeId: conversation.trade_id,
        recipientName: conversation.other_user_name
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.other_user_name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversation.unread_count}
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.last_message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {conversation.trade_type} {conversation.amount} {conversation.coin_type}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-600 mb-4">Start trading to begin conversations with other users</p>
        </div>
      )}
    </div>
  );
};

export default MessagesList;
