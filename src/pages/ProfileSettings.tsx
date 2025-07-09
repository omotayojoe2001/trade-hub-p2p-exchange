import React, { useState } from 'react';
import { ArrowLeft, Edit2, Camera, Mail, Phone, MapPin, Calendar, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const ProfileSettings = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || '',
    phoneNumber: profile?.phone_number || '',
    email: user?.email || '',
    location: 'Lagos, Nigeria',
    dateOfBirth: '1990-01-01',
    occupation: 'Software Engineer',
    bio: 'Crypto enthusiast and trader'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Handle save logic here
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/settings" className="mr-3">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
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

      <div className="p-4 space-y-6">
        {/* Profile Photo */}
        <Card className="bg-white p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={40} className="text-white" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Camera size={16} className="text-white" />
                </button>
              )}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{formData.displayName}</h2>
            <p className="text-sm text-gray-500">{profile?.user_type === 'merchant' ? 'Merchant' : 'Customer'}</p>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="bg-white p-6">
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
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          
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
        <Card className="bg-white p-6 border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
              Deactivate Account
            </Button>
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;