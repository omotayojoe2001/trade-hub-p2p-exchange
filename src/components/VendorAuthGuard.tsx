import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VendorAuthGuardProps {
  children: React.ReactNode;
}

const VendorAuthGuard: React.FC<VendorAuthGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkVendorAccess();
  }, [user]);

  const checkVendorAccess = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsVendor(false);
        setLoading(false);
        return;
      }

      // Check if user has vendor role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking vendor role:', error);
        setIsVendor(false);
      } else {
        setIsVendor(profile?.role === 'vendor');
      }
    } catch (error) {
      console.error('Error in vendor auth guard:', error);
      setIsVendor(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying vendor access...</p>
        </div>
      </div>
    );
  }

  if (!isVendor) {
    return <Navigate to="/vendor/login" replace />;
  }

  return <>{children}</>;
};

export default VendorAuthGuard;
