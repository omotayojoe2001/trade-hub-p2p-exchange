
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield, Lock, CreditCard, FileCheck, Store, Bell, Users, HelpCircle, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import StickyHeader from '@/components/StickyHeader';
import { useAuth } from '@/hooks/useAuth';

import { Switch } from '@/components/ui/switch';
import { creditsService } from '@/services/creditsService';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import { twoFactorAuthService } from '@/services/twoFactorAuthService';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const Settings = () => {
  const { signOut, user, profile } = useAuth();
  const { isSupported, isSubscribed, requestPermission } = usePushNotifications();
  const navigate = useNavigate();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserCredits();
      // Check 2FA status
      check2FAStatus();
    }
  }, [user]);

  const check2FAStatus = async () => {
    if (!user) return;
    try {
      const isEnabled = await twoFactorAuthService.is2FAEnabled(user.id);
      setTwoFactorEnabled(isEnabled);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setTwoFactorEnabled(false);
    }
  };

  const fetchUserCredits = async () => {
    if (!user) return;
    try {
      const credits = await creditsService.getUserCredits(user.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AJ Johnson';
  const userEmail = user?.email || 'aj@cryptoapp.com';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const profilePicture = profile?.avatar_url;

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (!user) return;
    
    if (enabled) {
      // Check if user has existing 2FA setup (even if disabled)
      const existingData = await twoFactorAuthService.get2FAData(user.id);
      
      if (existingData && existingData.secret) {
        // Reuse existing secret - just enable it
        const result = await twoFactorAuthService.enable2FA(user.id, existingData.secret, existingData.backup_codes || []);
        if (result.success) {
          setTwoFactorEnabled(true);
          toast({
            title: "2FA Re-enabled",
            description: "Using your existing Google Authenticator setup.",
          });
        }
      } else {
        // First time setup
        setShowTwoFactorSetup(true);
      }
    } else {
      const result = await twoFactorAuthService.disable2FA(user.id);
      if (result.success) {
        setTwoFactorEnabled(false);
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to disable 2FA",
          variant: "destructive"
        });
      }
    }
  };

  const handleTwoFactorComplete = () => {
    setTwoFactorEnabled(true);
    setShowTwoFactorSetup(false);
    // Refresh 2FA status from database
    check2FAStatus();
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await requestPermission();
      if (success) {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for trades.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in browser settings.",
          variant: "destructive"
        });
      }
    }
  };


  
  const settingsOptions = [

    {
      icon: <User size={20} className="text-[#1A73E8]" />,
      title: 'Profile Settings',
      description: 'Manage your personal information',
      link: '/profile-settings'
    },
    {
      icon: <Shield size={20} className="text-[#1A73E8]" />,
      title: 'Security',
      description: 'Password and privacy settings',
      link: '/security'
    },
    {
      icon: <Lock size={20} className="text-[#1A73E8]" />,
      title: 'Two-Factor Authentication',
      description: 'Add extra security to your account',
      hasToggle: true
    },
    {
      icon: <CreditCard size={20} className="text-[#1A73E8]" />,
      title: 'Payment Methods',
      description: 'Manage your bank accounts and cards',
      link: '/payment-methods'
    },
    {
      icon: <FileCheck size={20} className="text-[#1A73E8]" />,
      title: 'Identity Verification',
      description: 'Verify your identity with BVN and face',
      link: '/identity-verification'
    },
    {
      icon: <Store size={20} className="text-[#1A73E8]" />,
      title: 'Merchant Settings',
      description: 'Configure rates and trading preferences',
      link: '/merchant-settings'
    },

    {
      icon: <Users size={20} className="text-[#1A73E8]" />,
      title: 'Referrals',
      description: 'Invite friends and earn rewards',
      link: '/referrals'
    },
    {
      icon: <Bell size={20} className="text-[#1A73E8]" />,
      title: 'Push Notifications',
      description: 'Enable push notifications for trades',
      hasToggle: true,
      toggleType: 'notifications'
    },
    {
      icon: <HelpCircle size={20} className="text-[#1A73E8]" />,
      title: 'Help & Support',
      description: 'Contact us and view FAQs',
      link: '/help-support'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-['Poppins'] pb-20">
      <StickyHeader 
        title="Settings" 
        rightElement={
          <div className="inline-flex items-center px-3 py-1 border border-[#1A73E8] text-[#1A73E8] rounded-full text-sm font-medium bg-white">
            Credits: {userCredits.toLocaleString()}
          </div>
        }
      />
      {/* Header Section */}
      <div className="bg-white px-4 py-8 text-center">
        {/* Avatar */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#1A73E8] font-semibold text-xl">{userInitials}</span>
          )}
        </div>
        
        {/* User Info */}
        <h1 className="text-xl font-semibold text-gray-900 mb-1">{displayName}</h1>
        <p className="text-gray-500 text-sm mb-4">{userEmail}</p>
        
        {/* Credits Card */}
        <div className="inline-flex items-center px-4 py-2 border border-[#1A73E8] text-[#1A73E8] rounded-full text-sm font-medium bg-white">
          Credits: {userCredits.toLocaleString()}
        </div>
      </div>

      {/* Settings List Section */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {settingsOptions.map((option, index) => {
            if (option.hasToggle) {
              const isNotificationToggle = option.toggleType === 'notifications';
              return (
                <div key={index} className={`flex items-center justify-between p-3 ${index !== settingsOptions.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="flex items-center">
                    {option.icon}
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{option.title}</h3>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isNotificationToggle ? isSubscribed : twoFactorEnabled} 
                    onCheckedChange={isNotificationToggle ? handleNotificationToggle : handleTwoFactorToggle}
                  />
                </div>
              );
            }
            
            return (
              <Link
                key={index}
                to={option.link || '#'}
                className={`flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${index !== settingsOptions.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                <div className="flex items-center">
                  {option.icon}
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{option.title}</h3>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout Section */}
      <div className="px-4">
        <button
          onClick={() => signOut()}
          className="w-full text-center py-4 text-[#EF4444] font-semibold hover:bg-red-50 transition-colors rounded-xl"
        >
          Logout
        </button>
      </div>

      <BottomNavigation />
      
      {/* Two Factor Setup Dialog */}
      {user && (
        <TwoFactorSetup
          isOpen={showTwoFactorSetup}
          onClose={() => setShowTwoFactorSetup(false)}
          onComplete={handleTwoFactorComplete}
          userEmail={user.email || ''}
        />
      )}
    </div>
  );
};

export default Settings;
