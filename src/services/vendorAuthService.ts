import { supabase } from '@/integrations/supabase/client';

export interface VendorLoginRequest {
  identifier: string; // email or phone
  password: string;
}

export interface VendorLoginResponse {
  token: string;
  user: {
    id: string;
    role: string;
    is_premium: boolean;
    credits_balance: number;
    vendor_id?: string;
  };
}

export interface VendorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bank_account: string;
  bank_name: string;
  bank_code?: string;
  phone: string;
  active: boolean;
  location_lat?: number;
  location_lng?: number;
  working_hours: any;
  created_at: string;
  updated_at: string;
}

class VendorAuthService {
  async vendorLogin(credentials: VendorLoginRequest): Promise<VendorLoginResponse> {
    try {
      // Sign in with Supabase Auth
      let email = credentials.identifier;
      if (!credentials.identifier.includes('@')) {
        // If phone number provided, we need to find the email first
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone_number', credentials.identifier)
          .single();

        if (profileData) {
          // Get user email from auth.users via RPC or use phone as email
          email = `${credentials.identifier}@vendor.local`;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: credentials.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed');

      // Get user profile and verify vendor role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) throw profileError;
      if (profile.role !== 'vendor') {
        throw new Error('Access denied. Vendor role required.');
      }

      // Get vendor profile
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (vendorError) throw vendorError;

      return {
        token: authData.session?.access_token || '',
        user: {
          id: authData.user.id,
          role: profile.role,
          is_premium: profile.is_premium || false,
          credits_balance: profile.credits_balance || 0,
          vendor_id: vendorProfile.id,
        },
      };
    } catch (error: any) {
      console.error('Vendor login error:', error);
      throw new Error(error.message || 'Vendor login failed');
    }
  }

  async getVendorProfile(userId: string): Promise<VendorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      return null;
    }
  }

  async createVendorProfile(vendorData: Partial<VendorProfile>): Promise<VendorProfile> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating vendor profile:', error);
      throw new Error(error.message || 'Failed to create vendor profile');
    }
  }

  async updateVendorProfile(vendorId: string, updates: Partial<VendorProfile>): Promise<VendorProfile> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating vendor profile:', error);
      throw new Error(error.message || 'Failed to update vendor profile');
    }
  }

  async getSystemConfig(): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value');

      if (error) throw error;

      const config: Record<string, string> = {};
      data?.forEach(item => {
        config[item.key] = item.value;
      });

      return config;
    } catch (error) {
      console.error('Error fetching system config:', error);
      return {};
    }
  }

  async updateSystemConfig(key: string, value: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({ key, value, updated_at: new Date().toISOString() });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating system config:', error);
      throw new Error(error.message || 'Failed to update system config');
    }
  }

  // Utility function to check if user is vendor
  async isVendor(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) return false;
      return data.role === 'vendor';
    } catch (error) {
      return false;
    }
  }

  // Utility function to check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) return false;
      return data.role === 'admin';
    } catch (error) {
      return false;
    }
  }
}

export const vendorAuthService = new VendorAuthService();
