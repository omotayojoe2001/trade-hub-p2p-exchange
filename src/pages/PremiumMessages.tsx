import React, { useState } from 'react';
import { Crown, MessageCircle, Search, Star, Clock, Shield, Send, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumMessages = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const conversations = [
    {
      id: '1',
      name: 'John Doe',
      avatar: '👨‍💼',
      lastMessage: 'Payment confirmed! Thanks for the smooth transaction.',
      time: '2 mins ago',
      unread: 2,
      status: 'online',
      rating: 4.9,
      tradeId: 'PT001',
      isPremium: true
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      avatar: '👩‍💻',
      lastMessage: 'Cash delivery agent is on the way!',
      time: '15 mins ago',
      unread: 0,
      status: 'online',
      rating: 5.0,
      tradeId: 'PT002',
      isPremium: true
    },
    {
      id: '3',
      name: 'Premium Support',
      avatar: '🛡️',
      lastMessage: 'Your priority trade has been processed successfully.',
      time: '1 hour ago',
      unread: 1,
      status: 'online',
      rating: 5.0,
      isSupport: true,
      isPremium: true
    },
    {
      id: '4',
      name: 'Mike Chen',
      avatar: '👨‍🎓',
      lastMessage: 'Great doing business with you!',
      time: '3 hours ago',
      unread: 0,
      status: 'offline',
      rating: 4.8,
      tradeId: 'PT003',
      isPremium: false
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                    {conversation.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`} />
                  {conversation.isPremium && (
                    <Crown size={12} className="absolute -top-1 -right-1 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{conversation.name}</h4>
                      {conversation.isSupport && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          Support
                        </div>
                      )}
                      {conversation.rating && !conversation.isSupport && (
                        <div className="flex items-center text-xs text-yellow-600">
                          <Star size={12} className="mr-1 fill-current" />
                          {conversation.rating}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{conversation.time}</span>
                      {conversation.unread > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                    {conversation.lastMessage}
                  </p>
                  
                  {conversation.tradeId && (
                    <div className="flex items-center text-xs text-blue-600">
                      <MessageCircle size={12} className="mr-1" />
                      Trade: {conversation.tradeId}
                    </div>
                  )}
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
