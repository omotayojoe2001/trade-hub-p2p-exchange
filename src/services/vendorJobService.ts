import { supabase } from '@/integrations/supabase/client';
import { vendorAuthService } from './vendorAuthService';

export interface VendorJob {
  id: string;
  vendor_id?: string;
  premium_user_id: string;
  buyer_id?: string;
  trade_id?: string;
  amount_usd: number;
  amount_naira_received?: number;
  fee_naira: number;
  delivery_type: 'pickup' | 'delivery' | 'naira_to_usd';
  address_json?: any;
  status: 'pending_payment' | 'payment_received' | 'awaiting_handoff' | 'completed' | 'cancelled' | 'dispute';
  verification_code?: string;
  verification_code_hash?: string;
  code_generated_at?: string;
  code_expires_at?: string;
  payment_received_at?: string;
  completed_at?: string;
  bank_tx_reference?: string;
  payment_proof_url?: string;
  credits_required: number;
  credits_deducted: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  premium_user?: any;
  buyer?: any;
  vendor?: any;
  trade?: any;
}

export interface CreateVendorJobRequest {
  premium_user_id: string;
  buyer_id?: string;
  trade_id?: string;
  amount_usd: number;
  delivery_type: 'pickup' | 'delivery' | 'naira_to_usd';
  address_json?: any;
  credits_required: number;
}

export interface ConfirmPaymentRequest {
  amount_naira_received: number;
  bank_tx_reference?: string;
  payment_proof_url?: string;
}

class VendorJobService {
  // Calculate credits required based on USD amount
  async calculateCreditsRequired(amountUsd: number): Promise<number> {
    try {
      const config = await vendorAuthService.getSystemConfig();
      const creditUsdValue = parseFloat(config.CREDIT_USD_VALUE || '10');
      const roundingPolicy = config.POINTS_ROUNDING || 'ceil';
      
      const creditsNeeded = amountUsd / creditUsdValue;
      
      if (roundingPolicy === 'ceil') {
        return Math.ceil(creditsNeeded);
      } else {
        return Math.floor(creditsNeeded);
      }
    } catch (error) {
      console.error('Error calculating credits:', error);
      return Math.ceil(amountUsd / 10); // Default: 1 credit per $10
    }
  }

  // Create a new vendor job with auto-assignment and credit deduction
  async createVendorJob(jobData: CreateVendorJobRequest): Promise<VendorJob> {
    try {
      // Check if user has sufficient credits
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', jobData.premium_user_id)
        .single();

      if (userError) throw userError;

      const creditsRequired = await this.calculateCreditsRequired(jobData.amount_usd);

      if (userProfile.credits_balance < creditsRequired) {
        throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${userProfile.credits_balance}`);
      }

      // Auto-assign to an available vendor
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('active', true)
        .limit(1)
        .single();

      if (vendorError || !vendor) {
        throw new Error('No available delivery agents at the moment. Please try again later.');
      }

      // Create the vendor job with auto-assignment
      const { data, error } = await supabase
        .from('vendor_jobs')
        .insert({
          vendor_id: vendor.id,
          premium_user_id: jobData.premium_user_id,
          buyer_id: jobData.buyer_id,
          trade_id: jobData.trade_id,
          amount_usd: jobData.amount_usd,
          delivery_type: jobData.delivery_type,
          address_json: jobData.address_json,
          credits_required: creditsRequired,
          status: 'pending_payment',
          verification_code: this.generateSimpleVerificationCode()
        })
        .select(`*`)
        .single();

      if (error) throw error;

      // Deduct credits immediately upon job creation
      const { error: creditError } = await supabase
        .from('profiles')
        .update({
          credits_balance: userProfile.credits_balance - creditsRequired
        })
        .eq('user_id', jobData.premium_user_id);

      if (creditError) {
        // If credit deduction fails, delete the job
        await supabase.from('vendor_jobs').delete().eq('id', data.id);
        throw new Error('Failed to deduct credits. Job cancelled.');
      }

      return {
        ...data,
        delivery_type: data.delivery_type as 'pickup' | 'delivery' | 'naira_to_usd'
      } as VendorJob;
    } catch (error: any) {
      console.error('Error creating vendor job:', error);
      throw new Error(error.message || 'Failed to create vendor job');
    }
  }

  // Generate a simple 6-digit verification code
  private generateSimpleVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Get vendor jobs (for vendor dashboard)
  async getVendorJobs(vendorId: string, status?: string): Promise<VendorJob[]> {
    try {
      let query = supabase
        .from('vendor_jobs')
        .select(`
          *
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(job => ({
        ...job,
        delivery_type: job.delivery_type as 'pickup' | 'delivery' | 'naira_to_usd'
      })) as VendorJob[];
    } catch (error: any) {
      console.error('Error fetching vendor jobs:', error);
      throw new Error(error.message || 'Failed to fetch vendor jobs');
    }
  }

  // Get jobs for premium user
  async getUserJobs(userId: string): Promise<VendorJob[]> {
    try {
      const { data, error } = await supabase
        .from('vendor_jobs')
        .select(`
          *
        `)
        .eq('premium_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(job => ({
        ...job,
        delivery_type: job.delivery_type as 'pickup' | 'delivery' | 'naira_to_usd'
      })) as VendorJob[];
    } catch (error: any) {
      console.error('Error fetching user jobs:', error);
      throw new Error(error.message || 'Failed to fetch user jobs');
    }
  }

  // Confirm payment received (vendor action)
  async confirmPayment(jobId: string, paymentData: ConfirmPaymentRequest): Promise<VendorJob> {
    try {
      // Start transaction-like operations
      const { data: job, error: jobError } = await supabase
        .from('vendor_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      if (job.status !== 'pending_payment') {
        throw new Error('Job is not in pending_payment status');
      }

      // Update job status and payment info
      const { data: updatedJob, error: updateError } = await supabase
        .from('vendor_jobs')
        .update({
          status: 'payment_received',
          amount_naira_received: paymentData.amount_naira_received,
          bank_tx_reference: paymentData.bank_tx_reference,
          payment_proof_url: paymentData.payment_proof_url,
          payment_received_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (updateError) throw updateError;

      // If this is a crypto trade, release escrow
      if (job.trade_id) {
        await this.releaseEscrow(job.trade_id);
      }

      // Deduct credits if policy is on_vendor_confirm
      const config = await vendorAuthService.getSystemConfig();
      if (config.CREDITS_DEDUCTION_POLICY === 'on_vendor_confirm') {
        await this.deductCredits(job.premium_user_id, job.credits_required, jobId);
      }

      // Log vendor activity
      await this.logVendorActivity(job.vendor_id!, jobId, 'confirmed_payment', {
        amount_naira: paymentData.amount_naira_received,
        bank_reference: paymentData.bank_tx_reference
      });

      return {
        ...updatedJob,
        delivery_type: updatedJob.delivery_type as 'pickup' | 'delivery' | 'naira_to_usd'
      } as VendorJob;
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw new Error(error.message || 'Failed to confirm payment');
    }
  }

  // Generate verification code
  async generateVerificationCode(jobId: string): Promise<string> {
    try {
      const config = await vendorAuthService.getSystemConfig();
      const codeLength = parseInt(config.DELIVERY_CODE_LENGTH || '6');
      
      // Generate random numeric code
      const code = Math.floor(Math.random() * Math.pow(10, codeLength))
        .toString()
        .padStart(codeLength, '0');

      // Hash the code for storage (simple hash for demo - use bcrypt in production)
      const codeHash = btoa(code); // Base64 encoding for demo

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      const { error } = await supabase
        .from('vendor_jobs')
        .update({
          verification_code_hash: codeHash,
          code_generated_at: new Date().toISOString(),
          code_expires_at: expiresAt.toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      return code;
    } catch (error: any) {
      console.error('Error generating verification code:', error);
      throw new Error(error.message || 'Failed to generate verification code');
    }
  }

  // Verify code and complete job
  async verifyCodeAndComplete(jobId: string, code: string): Promise<VendorJob> {
    try {
      const { data: job, error: jobError } = await supabase
        .from('vendor_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Check if code is expired
      if (job.code_expires_at && new Date() > new Date(job.code_expires_at)) {
        throw new Error('Verification code has expired');
      }

      // Verify code (simple verification for demo)
      const expectedCode = atob(job.verification_code_hash || '');
      if (code !== expectedCode) {
        throw new Error('Invalid verification code');
      }

      // Mark job as completed
      const { data: completedJob, error: updateError } = await supabase
        .from('vendor_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log vendor activity
      await this.logVendorActivity(job.vendor_id!, jobId, 'completed_delivery', {
        verification_code_used: true
      });

      return {
        ...completedJob,
        delivery_type: completedJob.delivery_type as 'pickup' | 'delivery' | 'naira_to_usd'
      } as VendorJob;
    } catch (error: any) {
      console.error('Error verifying code:', error);
      throw new Error(error.message || 'Failed to verify code');
    }
  }

  // Release escrow for crypto trades
  private async releaseEscrow(tradeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      throw error;
    }
  }

  // Deduct credits from user
  private async deductCredits(userId: string, creditsAmount: number, jobId: string): Promise<void> {
    try {
      // Get current balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const newBalance = profile.credits_balance - creditsAmount;
      if (newBalance < 0) {
        throw new Error('Insufficient credits');
      }

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Mark credits as deducted in job
      await supabase
        .from('vendor_jobs')
        .update({ credits_deducted: true })
        .eq('id', jobId);

    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  }

  // Log vendor activity
  private async logVendorActivity(vendorId: string, jobId: string, action: string, meta: any = {}): Promise<void> {
    try {
      await supabase
        .from('vendor_activity_log')
        .insert({
          vendor_id: vendorId,
          job_id: jobId,
          action,
          meta
        });
    } catch (error) {
      console.error('Error logging vendor activity:', error);
      // Don't throw - logging failure shouldn't break main flow
    }
  }
}

export const vendorJobService = new VendorJobService();
