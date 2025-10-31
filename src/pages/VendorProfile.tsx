import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, CreditCard, Edit3, Save, X, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import VendorBottomNavigation from '@/components/vendor/VendorBottomNavigation';

interface VendorProfileData {
  id: string;
  name: string;
  display_name?: string;
  phone_number?: string;
  location?: string;
  account_number: string;
  bank_account?: string;
  bank_name: string;
  bank_code?: string;
  is_active: boolean;
  active?: boolean;
}

const VendorProfile = () => {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState<Partial<VendorProfileData>>({});

  useEffect(() => {
    loadVendorProfile();
  }, []);

  const loadVendorProfile = async () => {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) {
        setError('Vendor ID not found');
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditData(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      setError('');

      const { error } = await supabase
        .from('vendors')
        .update({
          display_name: editData.display_name,
          phone_number: editData.phone_number,
          location: editData.location,
          bank_account: editData.bank_account,
          bank_name: editData.bank_name,
          bank_code: editData.bank_code,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...editData });
      setIsEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile || {});
    setIsEditing(false);
    setError('');
  };

  const toggleActiveStatus = async () => {
    if (!profile) return;
    
    try {
      const newStatus = !profile.active;
      const { error } = await supabase
        .from('vendors')
        .update({ active: newStatus })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, active: newStatus });
      alert(newStatus ? '✅ You are now active for deliveries!' : '⏸️ You are now offline');
    } catch (error: any) {
      setError(error.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600">Manage your delivery agent profile</p>
          </div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-black" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              profile?.active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {profile?.active ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <Button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                {isEditing ? <X className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={editData.display_name || ''}
                  onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{profile?.display_name}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={editData.phone_number || ''}
                  onChange={(e) => setEditData({...editData, phone_number: e.target.value})}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{profile?.phone_number}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              {isEditing ? (
                <Input
                  value={editData.location || ''}
                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                  placeholder="Enter your location/area"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{profile?.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Bank Account Details</CardTitle>
            <p className="text-sm text-gray-600">
              Customers will send payments to this account
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              {isEditing ? (
                <Input
                  value={editData.bank_name || ''}
                  onChange={(e) => setEditData({...editData, bank_name: e.target.value})}
                  placeholder="Enter bank name"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span>{profile?.bank_name}</span>
                </div>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              {isEditing ? (
                <Input
                  value={editData.bank_account || ''}
                  onChange={(e) => setEditData({...editData, bank_account: e.target.value})}
                  placeholder="Enter account number"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg">{profile?.bank_account}</span>
                </div>
              )}
            </div>

            {/* Bank Code (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Code (Optional)
              </label>
              {isEditing ? (
                <Input
                  value={editData.bank_code || ''}
                  onChange={(e) => setEditData({...editData, bank_code: e.target.value})}
                  placeholder="Enter bank code"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{profile?.bank_code || 'Not set'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isEditing && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}

          <Button
            onClick={toggleActiveStatus}
            className={`w-full h-12 ${
              profile?.active 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {profile?.active ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Keep your phone number updated for customer contact</li>
              <li>• Ensure your bank details are correct for payments</li>
              <li>• Toggle online/offline status based on availability</li>
              <li>• You'll receive notifications for new delivery requests</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <VendorBottomNavigation />
    </div>
  );
};

export default VendorProfile;
