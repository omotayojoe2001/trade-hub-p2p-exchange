import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DeleteAccount = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <Link to="/profile-settings" className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Delete Account</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Warning Card */}
        <Card className="bg-red-50 border-red-200 p-6">
          <div className="flex items-start">
            <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={24} />
            <div>
              <h2 className="font-semibold text-red-800 mb-2">Warning: This action is permanent</h2>
              <p className="text-red-700 text-sm leading-relaxed">
                Deleting your account will permanently remove all your data, including:
              </p>
              <ul className="text-red-700 text-sm mt-2 space-y-1">
                <li>• All trade history and transactions</li>
                <li>• Messages and conversations</li>
                <li>• Profile information and settings</li>
                <li>• Wallet addresses and crypto data</li>
                <li>• Credits and purchase history</li>
              </ul>
              <p className="text-red-700 text-sm mt-3 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Card>

        {/* Alternative Options */}
        <Card className="bg-blue-50 border-blue-200 p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Consider these alternatives:</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 font-medium">Deactivate Account</p>
                <p className="text-blue-600 text-sm">Temporarily disable your account (reversible)</p>
              </div>
              <Link to="/profile-settings">
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                  Deactivate
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 font-medium">Contact Support</p>
                <p className="text-blue-600 text-sm">Get help with account issues</p>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                Contact
              </Button>
            </div>
          </div>
        </Card>

        {/* Delete Confirmation */}
        <Card className="bg-white border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <Trash2 className="mr-2" size={20} />
            Delete Account Permanently
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="deleteConfirm" className="text-gray-700">
                Type "DELETE MY ACCOUNT" to confirm:
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="mt-2"
              />
            </div>

            <div className="flex space-x-3">
              <Link to="/profile-settings" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeleteAccount;