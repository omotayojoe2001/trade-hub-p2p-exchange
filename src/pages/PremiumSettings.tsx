import React, { useState, useRef, useEffect } from 'react';
import { Crown, User, Shield, Bell, CreditCard, HelpCircle, LogOut, Camera, Upload, Settings, Star, Gift, Trash2, AlertTriangle, X, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumSettings = () => {
  const { toast } = useToast();
  const { isPremium, setPremium, premiumExpiry } = usePremium();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showProfilePictureDialog, setShowProfilePictureDialog] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [premiumSettings, setPremiumSettings] = useState({
    priorityTrading: true,
    instantNotifications: true,
    exclusiveOffers: true,
    premiumSupport: true,
    advancedAnalytics: true,
    autoAcceptTrades: false
  });

  useEffect(() => {
    const savedPicture = localStorage.getItem('profile-picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, []);

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive"
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicture(result);
        localStorage.setItem('profile-picture', result);
        setShowProfilePictureDialog(false);
        
        toast({
          title: "Profile Picture Updated",
          description: "Your premium profile picture has been updated successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    localStorage.removeItem('profile-picture');
    setShowProfilePictureDialog(false);
    
    toast({
      title: "Profile Picture Removed",
      description: "Your profile picture has been removed",
    });
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setPremiumSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    toast({
      title: "Setting Updated",
      description: `Premium ${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === 'DELETE') {
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion request has been submitted. You will receive a confirmation email.",
        variant: "destructive"
      });
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      // In real app, this would call the delete API
    } else {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm account deletion",
        variant: "destructive"
      });
    }
  };

  const handleCancelSubscription = () => {
    toast({
      title: "Subscription Cancelled",
      description: "Your premium subscription has been cancelled. You'll retain access until the end of your billing period.",
      variant: "destructive"
    });
    setShowSubscriptionModal(false);
  };

  const settingsItems = [
    {
      icon: <User size={20} className="text-blue-600" />,
      title: 'Premium Profile',
      description: 'Manage your premium profile',
      action: () => navigate('/premium-profile'),
      premium: false
    },
    {
      icon: <Shield size={20} className="text-green-600" />,
      title: 'Two-Factor Authentication',
      description: 'Enhanced premium security',
      action: () => navigate('/premium-2fa'),
      premium: true
    },
    {
      icon: <Gift size={20} className="text-purple-600" />,
      title: 'Premium Refer & Earn',
      description: 'Earn 2% lifetime from referrals',
      action: () => navigate('/premium-referral'),
      premium: true
    },
    {
      icon: <CreditCard size={20} className="text-orange-600" />,
      title: 'Payment Methods',
      description: 'Premium payment options',
      action: () => navigate('/premium-payment-methods'),
      premium: true
    },
    {
      icon: <Bell size={20} className="text-yellow-600" />,
      title: 'Notification Settings',
      description: 'Premium notification preferences',
      action: () => navigate('/premium-notification-settings'),
      premium: true
    },
    {
      icon: <Crown size={20} className="text-purple-600" />,
      title: 'Manage Subscription',
      description: 'View and manage your premium subscription',
      action: () => setShowSubscriptionModal(true),
      premium: true
    },
    {
      icon: <Trash2 size={20} className="text-red-600" />,
      title: 'Delete Account',
      description: 'Permanently delete your account and data',
      action: () => setShowDeleteModal(true),
      premium: false,
      dangerous: true
    },
    {
      icon: <HelpCircle size={20} className="text-indigo-600" />,
      title: 'Premium Support',
      description: '24/7 priority support',
      action: () => navigate('/premium-support'),
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Crown size={24} className="mr-2" />
              Premium Settings
            </h1>
            <p className="text-yellow-100 text-sm">Manage your premium experience</p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-xs font-bold">PREMIUM</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Premium Status */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-yellow-900 flex items-center">
              <Star size={20} className="mr-2" />
              Premium Status
            </h3>
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              ACTIVE
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-yellow-700">Member Since</div>
              <div className="font-semibold text-yellow-900">December 2024</div>
            </div>
            <div>
              <div className="text-sm text-yellow-700">Expires</div>
              <div className="font-semibold text-yellow-900">
                {premiumExpiry ? premiumExpiry.toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Section */}
        <Card className="p-4 bg-white border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Premium Profile</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfilePictureDialog(true)}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <Camera size={14} className="mr-1" />
              Edit Photo
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-yellow-600" />
                )}
              </div>
              <Crown size={16} className="absolute -top-1 -right-1 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">John Doe</h4>
              <p className="text-gray-600 text-sm">john.doe@example.com</p>
              <div className="flex items-center text-xs text-yellow-600 mt-1">
                <Crown size={12} className="mr-1" />
                Premium Member
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Features */}
        <Card className="p-4 bg-white border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-4">Premium Features</h3>
          <div className="space-y-4">
            {Object.entries(premiumSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {key === 'priorityTrading' && 'Get priority matching for all trades'}
                    {key === 'instantNotifications' && 'Receive instant premium notifications'}
                    {key === 'exclusiveOffers' && 'Access to exclusive premium offers'}
                    {key === 'premiumSupport' && '24/7 priority customer support'}
                    {key === 'advancedAnalytics' && 'Advanced trading analytics and insights'}
                    {key === 'autoAcceptTrades' && 'Automatically accept matching trades'}
                  </div>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleSettingChange(key, checked)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Settings Menu */}
        <Card className="p-4 bg-white border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
          <div className="space-y-3">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      {item.title}
                      {item.premium && (
                        <Crown size={12} className="ml-2 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
                <div className="text-gray-400">›</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Profile Picture Dialog */}
      <Dialog open={showProfilePictureDialog} onOpenChange={setShowProfilePictureDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Premium Profile Picture</span>
              <Crown size={16} className="text-yellow-500" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden relative">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-yellow-600" />
                )}
                <Crown size={20} className="absolute -top-2 -right-2 text-yellow-500" />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
              >
                <Upload size={16} className="mr-2" />
                {profilePicture ? 'Change Picture' : 'Upload Picture'}
              </Button>

              {profilePicture && (
                <Button
                  onClick={handleRemoveProfilePicture}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  Remove Picture
                </Button>
              )}

              <Button
                onClick={() => setShowProfilePictureDialog(false)}
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Cancel
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureSelect}
              className="hidden"
            />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 mb-2">Premium Guidelines:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• High-quality photos for premium experience</li>
                <li>• Maximum file size: 2MB</li>
                <li>• Supported formats: JPG, PNG, GIF</li>
                <li>• Square images work best</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumSettings;
