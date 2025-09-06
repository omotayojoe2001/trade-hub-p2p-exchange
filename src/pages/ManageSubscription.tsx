import React, { useState } from 'react';
import { Crown, ArrowLeft, Shield, Star, Zap, Clock, Users, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePremium } from '@/hooks/usePremium';
import { useToast } from '@/hooks/use-toast';

const ManageSubscription = () => {
  const navigate = useNavigate();
  const { isPremium, setPremium } = usePremium();
  const { toast } = useToast();
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTogglePremium = async () => {
    if (isPremium) {
      setShowDowngradeDialog(true);
    } else {
      setShowUpgradeDialog(true);
    }
  };

  const confirmDowngrade = async () => {
    setLoading(true);
    try {
      await setPremium(false);
      setShowDowngradeDialog(false);
      toast({
        title: "Switched to Regular User",
        description: "You've been downgraded to a regular user account. You can upgrade back to premium anytime.",
      });
      // Navigate back to regular settings
      navigate('/settings');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to downgrade account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmUpgrade = async () => {
    setLoading(true);
    try {
      await setPremium(true);
      setShowUpgradeDialog(false);
      toast({
        title: "Welcome to Premium!",
        description: "You've been upgraded to premium! Enjoy all premium features and benefits.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Priority Trading",
      description: "Get matched with the best merchants first"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: "Enhanced Security",
      description: "Advanced security features and protection"
    },
    {
      icon: <Star className="w-5 h-5 text-purple-500" />,
      title: "Premium Support",
      description: "24/7 priority customer support"
    },
    {
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: "Instant Notifications",
      description: "Real-time alerts for all your trades"
    },
    {
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      title: "Auto & Manual Matching",
      description: "Choose how you want to find merchants"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center">
            <Crown size={20} className="mr-2" />
            <h1 className="text-lg font-semibold">Manage Subscription</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status */}
        <Card className={`p-4 ${isPremium ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isPremium ? 'bg-yellow-200' : 'bg-gray-200'}`}>
                <Crown className={`w-6 h-6 ${isPremium ? 'text-yellow-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isPremium ? 'Premium Account' : 'Regular Account'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isPremium ? 'You have access to all premium features' : 'Basic trading features available'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPremium ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {isPremium ? 'PREMIUM' : 'REGULAR'}
            </div>
          </div>

          {/* Account Type Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div>
              <div className="font-medium text-gray-900">Account Type</div>
              <div className="text-sm text-gray-500">
                {isPremium ? 'Switch to regular user account' : 'Upgrade to premium account'}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${!isPremium ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                Regular
              </span>
              <button onClick={handleTogglePremium} disabled={loading}>
                {isPremium ? (
                  <ToggleRight className="w-8 h-8 text-yellow-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
              <span className={`text-sm ${isPremium ? 'font-medium text-yellow-600' : 'text-gray-500'}`}>
                Premium
              </span>
            </div>
          </div>
        </Card>

        {/* Premium Features */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Premium Features
          </h3>
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                {feature.icon}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{feature.title}</div>
                  <div className="text-sm text-gray-500">{feature.description}</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isPremium ? 'bg-green-500' : 'bg-gray-300'}`}>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Account Benefits */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-4">Current Benefits</h3>
          <div className="space-y-2 text-sm">
            {isPremium ? (
              <>
                <div className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Priority merchant matching
                </div>
                <div className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Auto and manual merchant selection
                </div>
                <div className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Enhanced security features
                </div>
                <div className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  24/7 priority support
                </div>
                <div className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Advanced trading analytics
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                  Basic merchant matching
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                  Manual merchant selection only
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                  Standard security
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                  Basic support
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Downgrade Confirmation Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Downgrade to Regular User?</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to downgrade to a regular user account? You'll lose access to:
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Priority merchant matching
              </div>
              <div className="flex items-center text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Auto merchant selection
              </div>
              <div className="flex items-center text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Premium support
              </div>
              <div className="flex items-center text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Advanced features
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> You can upgrade back to premium anytime from your settings.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDowngradeDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDowngrade}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                {loading ? 'Downgrading...' : 'Confirm Downgrade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>Upgrade to Premium?</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Upgrade to premium and get instant access to:
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Priority merchant matching
              </div>
              <div className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Auto and manual merchant selection
              </div>
              <div className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                24/7 premium support
              </div>
              <div className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Advanced trading features
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Special Offer:</strong> Get 100 free credits with your premium upgrade!
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowUpgradeDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUpgrade}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                disabled={loading}
              >
                {loading ? 'Upgrading...' : 'Upgrade Now'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageSubscription;