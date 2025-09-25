import { supabase } from '@/integrations/supabase/client';

export interface PremiumTradeRequest {
  amount_usd: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    phone: string;
    notes?: string;
  };
}

export interface PremiumTradeResponse {
  vendor_job_id: string;
  trade_code: string;
  vendor_info: {
    name: string;
    phone: string;
  };
  estimated_delivery: string;
  amount_naira: number;
}

export interface VendorJob {
  id: string;
  premium_user_id: string;
  vendor_id: string;
  amount_usd: number;
  amount_naira_received?: number;
  delivery_type: 'pickup' | 'delivery';
  status: 'pending_payment' | 'payment_confirmed' | 'in_progress' | 'completed' | 'cancelled';
  verification_code: string;
  address_json?: any;
  created_at: string;
  vendor?: {
    display_name: string;
    phone: string;
  };
  premium_user?: {
    display_name: string;
    phone_number: string;
  };
}

class PremiumTradeService {
  // Create a premium trade request
  async createPremiumTrade(request: PremiumTradeRequest): Promise<PremiumTradeResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check user's premium status and credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, credits_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_premium) {
        throw new Error('Premium membership required for this service');
      }

      const creditsNeeded = Math.ceil(request.amount_usd / 10);
      if ((profile.credits_balance || 0) < creditsNeeded) {
        throw new Error(`Insufficient credits. Need ${creditsNeeded} credits, have ${profile.credits_balance || 0}`);
      }

      // Call the database function to create premium trade
      const { data, error } = await supabase
        .rpc('create_premium_trade_with_vendor', {
          p_premium_user_id: user.id,
          p_amount_usd: request.amount_usd,
          p_delivery_type: request.delivery_type,
          p_delivery_address: request.delivery_address ? JSON.stringify(request.delivery_address) : null
        });

      if (error) throw error;

      // Get the created vendor job details
      const { data: vendorJob } = await supabase
        .from('vendor_jobs')
        .select(`
          *,
          vendor:vendors(display_name, phone)
        `)
        .eq('id', data)
        .single();

      if (!vendorJob) throw new Error('Failed to retrieve vendor job details');

      // Get current USD to NGN rate
      const { data: rate } = await supabase
        .from('system_rates')
        .select('sell_rate')
        .eq('currency_pair', 'USD_NGN')
        .single();

      const nairaAmount = request.amount_usd * (rate?.sell_rate || 1650);

      return {
        vendor_job_id: vendorJob.id,
        trade_code: vendorJob.verification_code,
        vendor_info: {
          name: vendorJob.vendor && typeof vendorJob.vendor === 'object' && !Array.isArray(vendorJob.vendor)
            ? ((vendorJob.vendor as any).display_name || (vendorJob.vendor as any).name || 'Vendor')
            : 'Vendor',
          phone: vendorJob.vendor && typeof vendorJob.vendor === 'object' && !Array.isArray(vendorJob.vendor)
            ? ((vendorJob.vendor as any).phone || (vendorJob.vendor as any).phone_number || '')
            : ''
        },
        estimated_delivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        amount_naira: nairaAmount
      };
    } catch (error: any) {
      console.error('Error creating premium trade:', error);
      throw new Error(error.message || 'Failed to create premium trade');
    }
  }

  // Get vendor jobs for vendor dashboard
  async getVendorJobs(): Promise<VendorJob[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get vendor profile
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) throw new Error('Vendor profile not found');

      const { data: jobs } = await supabase
        .from('vendor_jobs')
        .select(`
          *,
          vendor:vendors(display_name, phone),
          premium_user:profiles!vendor_jobs_premium_user_id_fkey(display_name, phone_number)
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      return (jobs || []).map(job => ({
        ...job,
        delivery_type: job.delivery_type as 'pickup' | 'delivery',
        status: job.status as 'completed' | 'cancelled' | 'pending_payment' | 'payment_confirmed' | 'in_progress',
        vendor: job.vendor && typeof job.vendor === 'object' && !Array.isArray(job.vendor) && 'display_name' in job.vendor
          ? {
              display_name: (job.vendor as any).display_name || 'Vendor',
              phone: (job.vendor as any).phone || ''
            }
          : {
              display_name: 'Vendor',
              phone: ''
            },
        premium_user: {
          display_name: 'Premium User',
          phone_number: ''
        }
      }));
    } catch (error: any) {
      console.error('Error fetching vendor jobs:', error);
      throw new Error(error.message || 'Failed to fetch vendor jobs');
    }
  }

  // Update vendor job status
  async updateVendorJobStatus(jobId: string, status: string, updates?: Partial<VendorJob>): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendor_jobs')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      // If payment is confirmed, notify the premium user
      if (status === 'payment_confirmed') {
        const { data: job } = await supabase
          .from('vendor_jobs')
          .select('premium_user_id, amount_usd, delivery_type')
          .eq('id', jobId)
          .single();

        if (job) {
          await supabase
            .from('notifications')
            .insert({
              user_id: job.premium_user_id,
              type: 'vendor_update',
              title: 'Payment Confirmed',
              message: `Vendor confirmed payment for your $${job.amount_usd} ${job.delivery_type} request`,
              data: { vendor_job_id: jobId, status }
            });
        }
      }
    } catch (error: any) {
      console.error('Error updating vendor job status:', error);
      throw new Error(error.message || 'Failed to update vendor job status');
    }
  }

  // Verify trade code
  async verifyTradeCode(code: string, vendorJobId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('vendor_jobs')
        .select('verification_code, status')
        .eq('id', vendorJobId)
        .single();

      if (!data) return false;

      const isValid = data.verification_code === code && data.status !== 'completed';
      
      if (isValid) {
        // Mark as completed
        await this.updateVendorJobStatus(vendorJobId, 'completed', {
          completed_at: new Date().toISOString()
        } as any);

        // Update premium trade code status
        await supabase
          .from('premium_trade_codes')
          .update({
            status: 'completed',
            verified_at: new Date().toISOString()
          })
          .eq('vendor_job_id', vendorJobId);
      }

      return isValid;
    } catch (error: any) {
      console.error('Error verifying trade code:', error);
      return false;
    }
  }

  // Get system rates
  async getSystemRates(): Promise<Record<string, { buy_rate: number; sell_rate: number }>> {
    try {
      const { data } = await supabase
        .from('system_rates')
        .select('currency_pair, buy_rate, sell_rate');

      const rates: Record<string, { buy_rate: number; sell_rate: number }> = {};
      
      data?.forEach(rate => {
        rates[rate.currency_pair] = {
          buy_rate: Number(rate.buy_rate),
          sell_rate: Number(rate.sell_rate)
        };
      });

      return rates;
    } catch (error: any) {
      console.error('Error fetching system rates:', error);
      return {};
    }
  }

  // Get premium user's trade history
  async getPremiumTradeHistory(): Promise<VendorJob[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: jobs } = await supabase
        .from('vendor_jobs')
        .select(`
          *,
          vendor:vendors(display_name, phone)
        `)
        .eq('premium_user_id', user.id)
        .order('created_at', { ascending: false });

      return (jobs || []).map(job => ({
        ...job,
        delivery_type: job.delivery_type as 'pickup' | 'delivery',
        status: job.status as 'completed' | 'cancelled' | 'pending_payment' | 'payment_confirmed' | 'in_progress',
        vendor: {
          display_name: 'Vendor',
          phone: ''
        }
      }));
    } catch (error: any) {
      console.error('Error fetching premium trade history:', error);
      throw new Error(error.message || 'Failed to fetch trade history');
    }
  }
}

export const premiumTradeService = new PremiumTradeService();