
import React from 'react';
import { ArrowLeft, ChevronRight, CreditCard, RefreshCw, Star, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className="w-5 h-5" />;
      case 'refresh-cw':
        return <RefreshCw className="w-5 h-5" />;
      case 'star':
        return <Star className="w-5 h-5" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <span className="text-lg">{iconName}</span>;
    }
  };

  const notifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Received',
      description: 'You received $150.00 from Jane Doe.',
      time: '2 mins ago',
      status: 'Completed',
      statusColor: 'text-green-600',
      icon: 'credit-card',
      iconBg: 'bg-green-100'
    },
    {
      id: 2,
      type: 'trade',
      title: 'Crypto Trade Request',
      description: 'Pending trade request for 0.05 BTC from John Smith.',
      time: '1 hour ago',
      status: 'Pending',
      statusColor: 'text-orange-600',
      icon: 'refresh-cw',
      iconBg: 'bg-blue-100'
    },
    {
      id: 3,
      type: 'rating',
      title: 'New Rating',
      description: 'Alice Johnson rated you 5 stars on your last trade.',
      time: '3 hours ago',
      status: 'New',
      statusColor: 'text-blue-600',
      icon: 'star',
      iconBg: 'bg-yellow-100',
      hasNewBadge: true
    },
    {
      id: 4,
      type: 'dispute',
      title: 'Dispute Update',
      description: 'Dispute #98765 status updated to In Progress.',
      time: 'Yesterday',
      status: 'In Progress',
      statusColor: 'text-orange-600',
      icon: 'alert-triangle',
      iconBg: 'bg-orange-100'
    },
    {
      id: 5,
      type: 'payment',
      title: 'Payment Received',
      description: 'You received $75.50 from Acme Corp.',
      time: '2 days ago',
      status: 'Completed',
      statusColor: 'text-green-600',
      icon: 'credit-card',
      iconBg: 'bg-green-100'
    },
    {
      id: 6,
      type: 'trade',
      title: 'Crypto Trade Request Completed',
      description: 'Your request for  0.1 ETH with Bob Williams was completed.',
      time: '3 days ago',
      status: 'Completed',
      statusColor: 'text-green-600',
      icon: 'refresh-cw',
      iconBg: 'bg-blue-100'
    },
    {
      id: 7,
      type: 'rating',
      title: 'Rating Viewed',
      description: 'Your 4-star rating from Charlie Brown has been viewed.',
      time: '4 days ago',
      status: 'Viewed',
      statusColor: 'text-gray-600',
      icon: 'star',
      iconBg: 'bg-yellow-100'
    },
    {
      id: 8,
      type: 'dispute',
      title: 'Dispute Resolved',
      description: 'Dispute #11223 resolved in your favor.',
      time: '1 week ago',
      status: 'Resolved',
      statusColor: 'text-green-600',
      icon: 'alert-triangle',
      iconBg: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <Link to="/home" className="mr-4">
          <ArrowLeft size={24} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`bg-white p-4 flex items-center justify-between ${
              index !== notifications.length - 1 ? 'border-b border-gray-100' : ''
            } ${index === 0 ? 'rounded-t-lg' : ''} ${
              index === notifications.length - 1 ? 'rounded-b-lg' : ''
            }`}
          >
            <div className="flex items-center flex-1">
              <div className={`w-10 h-10 ${notification.iconBg} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                {renderIcon(notification.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">{notification.time}</span>
                    {notification.hasNewBadge && (
                      <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                <div className="flex justify-end">
                  <span className={`text-xs font-medium ${notification.statusColor}`}>
                    {notification.status}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
