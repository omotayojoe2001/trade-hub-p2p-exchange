import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit2, Camera, Mail, Phone, MapPin, Calendar, User, Shield, Upload, AlertTriangle, Trash2 } from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';
import StickyHeader from '@/components/StickyHeader';

const ProfileSettings = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showProfilePictureDialog, setShowProfilePictureDialog] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Delete/Deactivate states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    email: user?.email || '',
    location: '',
    dateOfBirth: '',
    occupation: '',
    bio: ''
  });

  useEffect(() => {
    // Load profile data from database
    const loadProfileData = async () => {
      if (!user) return;

      try {
        // Try to load from profiles table first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setFormData({
            displayName: profileData.display_name || '',
            phoneNumber: profileData.phone_number || '',
            email: user.email || '',
            location: profileData.location || '',
            dateOfBirth: profileData.date_of_birth || '',
            occupation: profileData.occupation || '',
            bio: profileData.bio || ''
          });
          setProfilePicture(profileData.avatar_url);
        } else {
          // Fallback to user_profiles table
          const { data: userProfileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (userProfileData) {
            setFormData({
              displayName: userProfileData.full_name || '',
              phoneNumber: userProfileData.phone || '',
              email: user.email || '',
              location: (userProfileData as any)?.location || '',
              dateOfBirth: (userProfileData as any)?.date_of_birth || '',
              occupation: (userProfileData as any)?.occupation || '',
              bio: (userProfileData as any)?.bio || ''
            });
            setProfilePicture((userProfileData as any)?.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Validate required fields
      if (!formData.displayName.trim()) {
        toast({
          title: "Validation Error",
          description: "Display name is required.",
          variant: "destructive"
        });
        return;
      }

      // Save to both tables for compatibility
      const profileData = {
        user_id: user.id,
        display_name: formData.displayName.trim(),
        phone_number: formData.phoneNumber.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        date_of_birth: formData.dateOfBirth || null,
        occupation: formData.occupation.trim(),
        updated_at: new Date().toISOString()
      };

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Update user_profiles table
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.displayName.trim(),
          phone: formData.phoneNumber.trim(),
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          date_of_birth: formData.dateOfBirth || null,
          occupation: formData.occupation.trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (userProfileError) {
        console.warn('Failed to update user_profiles:', userProfileError);
        // Don't fail the operation if user_profiles update fails
      }

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      // Refresh the profile data without page reload
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) {
        setFormData({
          displayName: updatedProfile.display_name || '',
          phoneNumber: updatedProfile.phone_number || '',
          email: user.email || '',
          location: updatedProfile.location || '',
          dateOfBirth: updatedProfile.date_of_birth || '',
          occupation: updatedProfile.occupation || '',
          bio: updatedProfile.bio || ''
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE MY ACCOUNT' to confirm.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);

      // Delete user data from Supabase
      const { error } = await supabase.auth.admin.deleteUser(user!.id);

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsDeactivating(true);

      // Update profile to mark as deactivated
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated. You can reactivate it by logging in again.",
      });

      // Sign out and redirect
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeactivating(false);
      setShowDeactivateDialog(false);
    }
  };

  const handleProfilePictureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

    setIsUploadingPicture(true);

    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await supabase.from('profiles').upsert({
        user_id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });

      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });

      setProfilePicture(publicUrl);
      setShowProfilePictureDialog(false);

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPicture(false);
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

  return (
    <div className="min-h-screen bg-white font-['Poppins'] pb-20">
      <StickyHeader 
        title="Profile Settings" 
        showBackButton={true}
        backPath="/settings"
        rightElement={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 size={16} className="mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        }
      />
      {/* Header */}
      <div className="bg-white border-b border-[#EAEAEA] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/settings" className="mr-3">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Profile Settings</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 size={16} className="mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Profile Photo */}
        <Card className="bg-white p-4">
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden mx-auto">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
              <button
                onClick={() => setShowProfilePictureDialog(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg border-2 border-white"
              >
                <Camera size={16} className="text-white" />
              </button>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{formData.displayName}</h2>
            <p className="text-sm text-gray-500">{profile?.user_type === 'merchant' ? 'Merchant' : 'Customer'}</p>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="bg-white p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              {isEditing ? (
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter your display name"
                />
              ) : (
                <div className="flex items-center">
                  <User size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-900">{formData.displayName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="flex items-center">
                <Mail size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-900">{formData.email}</span>
                <div className="ml-auto">
                  <div className="flex items-center">
                    <Shield size={14} className="text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="flex items-center">
                  <Phone size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-900">{formData.phoneNumber || 'Not provided'}</span>
                  {!formData.phoneNumber && (
                    <span className="ml-auto text-xs text-orange-600">Not verified</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your location"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-900">{formData.location}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              ) : (
                <div className="flex items-center">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-900">{new Date(formData.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
              {isEditing ? (
                <Input
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Enter your occupation"
                />
              ) : (
                <div className="flex items-center">
                  <span className="text-gray-900">{formData.occupation}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                />
              ) : (
                <p className="text-gray-900">{formData.bio}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 mt-6">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          )}
        </Card>



        {/* Account Status */}
        <Card className="bg-card p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Account Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Type</span>
              <span className="text-sm font-medium text-blue-600 capitalize">{profile?.user_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Verification</span>
              <div className="flex items-center">
                <Shield size={14} className="text-green-500 mr-1" />
                <span className="text-sm text-green-600">Verified</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Phone Verification</span>
              <span className="text-sm text-orange-600">Pending</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">KYC Status</span>
              <span className="text-sm text-orange-600">Pending</span>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white p-4 border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => setShowDeactivateDialog(true)}
            >
              Deactivate Account
            </Button>
            <Link to="/delete-account">
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-2" size={16} />
                Delete Account
              </Button>
            </Link>
          </div>
        </Card>
      </div>

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
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <User size={48} className="text-gray-400" />
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

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Warning: This action is permanent</h4>
                  <p className="text-red-700 text-sm">
                    Deleting your account will permanently remove all your data, including trades, messages, and settings. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="deleteConfirm">Type "DELETE MY ACCOUNT" to confirm:</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-600">Deactivate Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-orange-500 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">Account Deactivation</h4>
                  <p className="text-orange-700 text-sm">
                    Your account will be temporarily disabled. You can reactivate it anytime by logging in again. Your data will be preserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default ProfileSettings;