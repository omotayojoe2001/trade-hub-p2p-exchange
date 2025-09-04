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
        setProfile(profileData);
        return;
      }

      // Fallback to user_profiles table
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userProfileError && userProfileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', userProfileError);
        return;
      }

      // Transform user_profiles data to match expected profile structure
      if (userProfileData) {
        setProfile({
          ...userProfileData,
          profile_completed: true, // Assume completed if user_profiles exists
          user_type: 'customer',
          display_name: userProfileData.full_name,
          username: userProfileData.full_name?.toLowerCase().replace(/\s+/g, '_') || 'user'
        });
      }
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
      // Store logout reason
      localStorage.setItem('logout-reason', reason);

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