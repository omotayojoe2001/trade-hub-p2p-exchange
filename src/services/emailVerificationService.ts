import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationService {
  sendVerificationEmail: (email: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

class CustomEmailVerificationService implements EmailVerificationService {
  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async sendVerificationEmail(email: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token in database
      const { error: dbError } = await supabase
        .from('email_verifications')
        .upsert({
          user_id: userId,
          email: email,
          token: token,
          expires_at: expiresAt.toISOString(),
          verified: false
        });

      if (dbError) throw dbError;

      // Send email via your preferred email service (e.g., SendGrid, Mailgun, etc.)
      const verificationUrl = `${window.location.origin}/verify-email?token=${token}`;
      
      // For now, we'll use a simple fetch to a backend endpoint
      // Replace this with your actual email service
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationUrl,
          userName: email.split('@')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find verification record
      const { data: verification, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', token)
        .eq('verified', false)
        .single();

      if (fetchError || !verification) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Check if token is expired
      if (new Date() > new Date(verification.expires_at)) {
        return { success: false, error: 'Verification token has expired' };
      }

      // Mark as verified
      const { error: updateError } = await supabase
        .from('email_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('token', token);

      if (updateError) throw updateError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('user_id', verification.user_id);

      if (profileError) throw profileError;

      return { success: true };
    } catch (error: any) {
      console.error('Error verifying email:', error);
      return { success: false, error: error.message };
    }
  }

  async resendVerificationEmail(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.email) {
        return { success: false, error: 'User email not found' };
      }

      return await this.sendVerificationEmail(profile.email, userId);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      return { success: false, error: error.message };
    }
  }
}

export const emailVerificationService = new CustomEmailVerificationService();