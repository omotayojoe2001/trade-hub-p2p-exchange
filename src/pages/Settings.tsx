
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bell, ChevronRight, User, Shield, CreditCard, HelpCircle, LogOut, Gift, TrendingUp, FileCheck, Smartphone, Camera, Upload, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { usePremium } from '@/hooks/usePremium';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import { getTwoFactorData, disableTwoFactor, reEnableTwoFactor } from '@/services/twoFactorAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Settings = () => {
  const { signOut, user } = useAuth();
  const { isQuickAuthActive } = useQuickAuth();
  const { isPremium } = usePremium();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect premium users to premium settings
  React.useEffect(() => {
    if (user && isPremium) {
      navigate('/premium-settings');
    }
  }, [user, isPremium, navigate]);

  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showProfilePictureDialog, setShowProfilePictureDialog] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  useEffect(() => {
    const twoFactorData = getTwoFactorData();
    setTwoFactorEnabled(twoFactorData.isEnabled);

    // Load saved profile picture
    const savedPicture = localStorage.getItem('profile-picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, []);

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      // Convert to base64 and save
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicture(result);
        localStorage.setItem('profile-picture', result);
        setShowProfilePictureDialog(false);

        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully",
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

  const handleDisableTwoFactor = () => {
    disableTwoFactor();
    setTwoFactorEnabled(false);
    toast({
      title: "2FA Disabled",
      description: "Two-factor authentication has been disabled. Your setup is saved for quick re-enabling.",
    });
  };

  const handleEnableTwoFactor = () => {
    // Try to re-enable with existing secret first
    const reEnabled = reEnableTwoFactor();

    if (reEnabled) {
      setTwoFactorEnabled(true);
      toast({
        title: "2FA Re-enabled",
        description: "Two-factor authentication has been re-enabled using your existing setup.",
      });
    } else {
      // Need full setup
      setShowTwoFactorSetup(true);
    }
  };

  const handleTwoFactorSetupComplete = () => {
    setTwoFactorEnabled(true);
    setShowTwoFactorSetup(false);
  };
  
  const settingsOptions = [
    {
      icon: <User size={20} className="text-blue-600" />,
      title: 'Profile Settings',
      description: 'Manage your personal information',
      hasChevron: true,
      link: '/profile-settings'
    },
    {
      icon: <Shield size={20} className="text-green-600" />,
      title: 'Security',
      description: 'Password and privacy settings',
      hasChevron: true,
      link: '/security'
    },
    {
      icon: <Smartphone size={20} className="text-purple-600" />,
      title: 'Two-Factor Authentication',
      description: twoFactorEnabled ? 'Enabled - Extra security for your account' : 'Add extra security to your account',
      hasChevron: false,
      action: twoFactorEnabled ? 'disable' : 'enable'
    },
    {
      icon: <CreditCard size={20} className="text-purple-600" />,
      title: 'Payment Methods',
      description: 'Manage your bank accounts and cards',
      hasChevron: true,
      link: '/payment-methods'
    },
    {
      icon: <FileCheck size={20} className="text-blue-600" />,
      title: 'Identity Verification',
      description: 'Verify your identity with BVN and face verification',
      hasChevron: true,
      link: '/identity-verification'
    },
    {
      icon: <TrendingUp size={20} className="text-emerald-600" />,
      title: 'Merchant Settings',
      description: 'Configure rates and trading preferences',
      hasChevron: true,
      link: '/merchant-settings'
    },
    {
      icon: <Bell size={20} className="text-orange-600" />,
      title: 'Notifications',
      description: 'Push notifications and email alerts',
      hasChevron: true,
      link: '/notifications'
    },
    {
      icon: <Gift size={20} className="text-pink-600" />,
      title: 'Referrals',
      description: 'Invite friends and earn rewards',
      hasChevron: true,
      link: '/referrals'
    },
    {
      icon: <HelpCircle size={20} className="text-gray-600" />,
      title: 'Help & Support',
      description: 'Contact us and view FAQs',
      hasChevron: true,
      link: '/help-support'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            {isPremium && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                <Crown size={10} className="mr-1" />
                PREMIUM
              </div>
            )}
          </div>
          <div className="relative">
            <div
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={() => setShowProfilePictureDialog(true)}
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-200">
              <Camera size={8} className="text-gray-600" />
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Settings Options */}
      <div className="p-4 space-y-4">
        {settingsOptions.map((option, index) => {
          if (option.action) {
            // Handle 2FA action
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => {
                  if (option.action === 'enable') {
                    handleEnableTwoFactor();
                  } else if (option.action === 'disable') {
                    handleDisableTwoFactor();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{option.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {option.action === 'enable' ? (
                      <span className="text-blue-600">Enable</span>
                    ) : (
                      <span className="text-red-600">Disable</span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={index}
              to={option.link}
              className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{option.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                </div>
                {option.hasChevron && (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-4">
        <div
          className="bg-white rounded-lg p-4 border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
          onClick={() => signOut()}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <LogOut size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-600">Logout</h3>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
          </div>
        </div>
      </div>

      {!isQuickAuthActive && (isPremium ? <PremiumBottomNavigation /> : <BottomNavigation />)}

      <TwoFactorSetup
        isOpen={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onComplete={handleTwoFactorSetupComplete}
        userEmail="user@example.com" // Replace with actual user email
      />

      {/* Profile Picture Dialog */}
      <Dialog open={showProfilePictureDialog} onOpenChange={setShowProfilePictureDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Profile Picture</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Picture Preview */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Upload Options */}
            <div className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUploadingPicture}
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
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureSelect}
              className="hidden"
            />

            {/* Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-2">Guidelines:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use a clear photo of yourself</li>
                <li>• Maximum file size: 2MB</li>
                <li>• Supported formats: JPG, PNG, GIF</li>
                <li>• Square images work best</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
