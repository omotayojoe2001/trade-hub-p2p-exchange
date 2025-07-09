import React, { useState } from 'react';
import { ArrowLeft, Copy, Share2, Twitter, MessageCircle, Filter, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const Referrals = () => {
  const [activeTab, setActiveTab] = useState('Week');
  const { toast } = useToast();
  
  const referralLink = "https://app.example.com/refer/username123";
  
  const referralData = [
    {
      id: 1,
      name: "Aminu B.",
      joinDate: "Apr 2",
      earnings: "₦6,300",
      status: "Active"
    },
    {
      id: 2,
      name: "Kelvin O.",
      joinDate: "May 8",
      earnings: "₦1,020",
      status: "Active"
    },
    {
      id: 3,
      name: "Fatima A.",
      joinDate: "May 12",
      earnings: "₦0.00",
      status: "Pending"
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard."
    });
  };

  const chartData = [
    { day: 'Mon', value: 2000 },
    { day: 'Tue', value: 3000 },
    { day: 'Wed', value: 1800 },
    { day: 'Thu', value: 4200 },
    { day: 'Fri', value: 3800 },
    { day: 'Sat', value: 2800 },
    { day: 'Sun', value: 2400 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/settings" className="mr-3">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Referral Dashboard</h1>
          </div>
          <MoreVertical size={24} className="text-gray-600" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Lifetime Summary */}
        <Card className="bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lifetime Summary</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-3xl font-bold text-blue-600">52</p>
              <p className="text-sm text-gray-500">Total Referrals</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">36</p>
              <p className="text-sm text-gray-500">Active Traders</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Earnings</span>
              <span className="text-xl font-bold text-gray-900">₦184,300</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">This Month</span>
              <span className="text-lg font-semibold text-green-600">₦22,100</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">You earn lifetime commission on every transaction your referrals make.</span>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Commission Rate: 0.3% of trade volume
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Referral Link */}
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700 break-all">{referralLink}</p>
          </div>

          <div className="flex space-x-3 mb-4">
            <Button onClick={handleCopyLink} className="bg-blue-600 hover:bg-blue-700 flex-1">
              <Copy size={16} className="mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="icon">
              <Share2 size={16} />
            </Button>
            <Button variant="outline" size="icon">
              <Twitter size={16} />
            </Button>
            <Button variant="outline" size="icon">
              <MessageCircle size={16} />
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            This link is unique to your account. All signups are tracked.
          </p>
        </Card>

        {/* Earnings Analytics */}
        <Card className="bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Earnings Analytics</h3>
            <div className="flex space-x-2">
              {['Week', 'Month', 'All'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Chart */}
          <div className="relative h-32 mb-4">
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-blue-500 rounded-t"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-500">
            <span>1k</span>
            <span>2k</span>
            <span>3k</span>
            <span>4k</span>
            <span>5k</span>
          </div>
        </Card>

        {/* Referral Earnings */}
        <Card className="bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Referral Earnings</h3>
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
          </div>

          <div className="space-y-3">
            {referralData.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-medium">
                      {referral.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{referral.name}</p>
                    <p className="text-sm text-gray-500">Joined {referral.joinDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{referral.earnings}</p>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      referral.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm ${
                      referral.status === 'Active' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            View All Referrals
          </Button>
        </Card>

        {/* How Referral Rewards Work */}
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Referral Rewards Work</h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-gray-700">Invite friends using your referral link</p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-gray-700">Once they sign up and start trading, you begin earning</p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-gray-700">You earn 0.3% of every trade they make — for life</p>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-gray-700">Commissions are tracked in real time</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Example:</span> Your referral trades ₦1,000,000 — you earn ₦3,000 instantly.
              </p>
            </div>
          </div>
        </Card>

        {/* Withdraw Earnings */}
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Earnings</h3>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Available Balance</span>
            <span className="text-xl font-bold text-gray-900">₦184,300</span>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-4">
            <Share2 size={16} className="mr-2" />
            Sell
          </Button>

          <Button variant="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50">
            Earnings History
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            Referral earnings can be withdrawn once they hit ₦5,000 minimum.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Referrals;