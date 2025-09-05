import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, User, Mail, Phone, MapPin, Calendar, Camera, Edit3, Shield, Star, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import { creditsService } from '@/services/creditsService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const PremiumProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    loadCreditsBalance();
    loadProfile();
  }, [user]);

  const loadCreditsBalance = async () => {
    if (!user?.id) return;
    try {
      const balance = await creditsService.getCreditBalance(user.id);
      setCreditsBalance(balance);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Update edit data when profile loads
      if (data) {
        const nameParts = data.display_name?.split(' ') || [];
        setEditData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: data.phone_number || '',
          location: data.location || '',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: `${editData.firstName} ${editData.lastName}`,
          phone_number: editData.phone,
          location: editData.location,
          bio: editData.bio
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Reload profile data
      await loadProfile();
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your premium profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-settings" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <User size={24} className="mr-2 text-gray-600" />
                Premium Profile
              </h1>
              <p className="text-gray-600 text-sm">Manage your premium account details</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile?.display_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown size={12} className="text-white" />
              </div>
              <button className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                <Camera size={12} className="text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.display_name || user?.email?.split('@')[0] || 'Premium User'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600 ml-2">5.0 Premium Rating</span>
                </div>
                <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                  <CreditCard size={14} className="text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">{creditsBalance} Credits</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
            >
              <Edit3 size={16} className="mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {/* Premium Status */}
          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown size={24} className="text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Premium Member</h3>
                  <p className="text-sm text-yellow-700">Active since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-yellow-700">Expires</div>
                <div className="font-semibold text-yellow-900">Dec 2025</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                {isEditing ? (
                  <Input
                    value={editData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-900">{profile?.display_name?.split(' ')[0] || 'User'}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                {isEditing ? (
                  <Input
                    value={editData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-900">{profile?.display_name?.split(' ').slice(1).join(' ') || 'User'}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-900">{profile?.phone_number || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              {isEditing ? (
                <Input
                  value={editData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-900">{profile?.location || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <Input
                  value={editData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Edit3 size={16} className="text-gray-400" />
                  <span className="text-gray-900">{profile?.bio || 'No bio provided'}</span>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleSave}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Crown size={16} className="mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>

        {/* Premium Stats */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Premium Trading Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">47</div>
              <div className="text-sm text-gray-600">Premium Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">₦2.4M</div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">8.5s</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>
        </Card>

        {/* Account Security */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Shield size={20} className="mr-2 text-gray-600" />
            Account Security
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-sm text-gray-600">Enhanced premium security</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Premium Verification</div>
                <div className="text-sm text-gray-600">Identity verified with premium status</div>
              </div>
              <div className="flex items-center space-x-2">
                <Crown size={12} className="text-yellow-500" />
                <span className="text-sm text-yellow-600">Verified</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/premium-2fa')}
            variant="outline"
            className="h-12"
          >
            <Shield size={16} className="mr-2" />
            Security Settings
          </Button>
          <Button
            onClick={() => navigate('/premium-referral')}
            variant="outline"
            className="h-12"
          >
            <Crown size={16} className="mr-2 text-yellow-600" />
            Refer & Earn
          </Button>
        </div>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumProfile;
