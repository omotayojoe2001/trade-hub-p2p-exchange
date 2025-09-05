import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Users, Copy, Share, Gift, DollarSign, TrendingUp, Calendar, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumReferral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferred: 0,
    activeReferrals: 0,
    lifetimeEarnings: 0,
    thisMonthEarnings: 0,
    pendingEarnings: 0
  });
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Generate referral code from user ID
      const code = `REF${user.id.substring(0, 8).toUpperCase()}`;
      setReferralCode(code);
      setReferralLink(`https://tradehub.ng/ref/${code}`);

      // Load real referral data from database
      // For now, show zeros since we don't have referral system implemented
      setReferralStats({
        totalReferred: 0,
        activeReferrals: 0,
        lifetimeEarnings: 0,
        thisMonthEarnings: 0,
        pendingEarnings: 0
      });

      setRecentReferrals([]);

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Referral Code Copied!",
      description: "Your premium referral code has been copied to clipboard",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral Link Copied!",
      description: "Your premium referral link has been copied to clipboard",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join TradeHub Premium',
        text: 'Join me on TradeHub Premium for the best crypto trading experience!',
        url: referralLink,
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-dashboard" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users size={24} className="mr-2 text-gray-600" />
                Premium Referrals
              </h1>
              <p className="text-gray-600 text-sm">Earn 2% lifetime from every referral trade</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Earnings Overview */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Earnings Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">₦{referralStats.lifetimeEarnings.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Lifetime Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">₦{referralStats.thisMonthEarnings.toLocaleString()}</div>
              <div className="text-sm text-gray-600">This Month</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{referralStats.totalReferred}</div>
              <div className="text-xs text-gray-600">Total Referred</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{referralStats.activeReferrals}</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">₦{referralStats.pendingEarnings.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">How Premium Referrals Work</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <div className="font-medium text-gray-900">Share Your Link</div>
                <div className="text-sm text-gray-600">Invite friends using your unique referral link</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <div className="font-medium text-gray-900">They Join Premium</div>
                <div className="text-sm text-gray-600">Your friends sign up and upgrade to premium</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <div className="font-medium text-gray-900">Earn 2% Forever</div>
                <div className="text-sm text-gray-600">Get 2% from every successful trade they make, for life</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Referral Tools */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Share Your Referral</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
              <div className="flex space-x-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
                <Button onClick={handleCopyCode} variant="outline">
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
              <div className="flex space-x-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1 bg-gray-50 text-sm"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <Button onClick={handleShare} className="w-full bg-gray-900 hover:bg-gray-800 text-white">
              <Share size={16} className="mr-2" />
              Share Referral Link
            </Button>
          </div>
        </Card>

        {/* Recent Referrals */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{referral.name}</div>
                    <div className="text-sm text-gray-600">
                      {referral.totalTrades} trades • Joined {new Date(referral.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">₦{referral.yourEarnings.toLocaleString()}</div>
                  <div className={`text-xs ${referral.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                    {referral.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Withdrawal */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Withdraw Earnings</h3>
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Available for withdrawal:</span>
              <span className="font-bold text-gray-900">₦{(referralStats.lifetimeEarnings - referralStats.pendingEarnings).toLocaleString()}</span>
            </div>
          </div>
          <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
            <DollarSign size={16} className="mr-2" />
            Withdraw Earnings
          </Button>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumReferral;
