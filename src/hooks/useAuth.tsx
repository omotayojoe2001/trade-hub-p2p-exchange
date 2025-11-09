import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async (userId: string) => {
    try {
      // Try profiles table first (for profile setup compatibility)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profileError && profileData) {
        // Check if user role matches current app context
        const isVendorApp = window.location.pathname.startsWith('/vendor');
        const isVendor = profileData.role === 'vendor';
        
        if (isVendorApp && !isVendor) {
          // User trying to access vendor app
          await supabase.auth.signOut();
          window.location.href = '/auth';
          return;
        } else if (!isVendorApp && isVendor) {
          // Vendor trying to access user app
          await supabase.auth.signOut();
          window.location.href = '/vendor/login';
          return;
        }
        
        setProfile(profileData);
        return;
      }

      // If no profile found, set to null
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      setProfile(null);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile data after setting user
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (reason: 'manual' | 'timeout' = 'manual') => {
    try {
      // Store logout reason and mark manual logout for 2FA requirement
      localStorage.setItem('logout-reason', reason);
      if (reason === 'manual') {
        localStorage.setItem('manual_logout', 'true');
        localStorage.removeItem('2fa_completed');
      }

      // Clean up auth state first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Sign out globally
      await supabase.auth.signOut({ scope: 'global' });

      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);

      // Navigate based on reason
      if (reason === 'manual') {
        window.location.href = '/';
      } else {
        // For timeout, stay on current page to show quick auth
        window.location.reload();
      }
    } catch (error) {
      // Force cleanup even if signOut fails
      setUser(null);
      setSession(null);
      setProfile(null);

      if (reason === 'manual') {
        window.location.href = '/';
      } else {
        window.location.reload();
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    profile,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};