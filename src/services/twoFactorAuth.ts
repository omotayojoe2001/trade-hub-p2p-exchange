// Two-Factor Authentication Service using Google Authenticator
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorData {
  isEnabled: boolean;
  secret?: string;
  backupCodes?: string[];
  lastUsedAt?: string;
}

// Generate a new 2FA secret and setup data
export const generateTwoFactorSetup = async (
  userEmail: string,
  appName: string = 'Central Exchange'
): Promise<TwoFactorSetup> => {
  // Generate a random secret
  const secret = new OTPAuth.Secret({ size: 20 });
  
  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer: appName,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  // Generate QR code URL
  const otpAuthUrl = totp.toString();
  const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
    manualEntryKey: secret.base32
  };
};

// Generate backup codes for 2FA
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup code
    const code = Math.random().toString().slice(2, 10);
    codes.push(code);
  }
  return codes;
};

// Verify TOTP code
export const verifyTOTPCode = (token: string, secret: string): boolean => {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Verify with some time tolerance (±1 period)
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    return false;
  }
};

// Verify backup code
export const verifyBackupCode = (
  code: string, 
  backupCodes: string[]
): { isValid: boolean; remainingCodes: string[] } => {
  const codeIndex = backupCodes.indexOf(code);
  
  if (codeIndex === -1) {
    return { isValid: false, remainingCodes: backupCodes };
  }

  // Remove used backup code
  const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);
  
  return { isValid: true, remainingCodes };
};

// Get current TOTP code (for testing purposes)
export const getCurrentTOTPCode = (secret: string): string => {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    return totp.generate();
  } catch (error) {
    console.error('Error generating TOTP code:', error);
    return '';
  }
};

// Save 2FA data to localStorage (in production, use secure backend)
export const saveTwoFactorData = (data: TwoFactorData): void => {
  localStorage.setItem('two-factor-auth', JSON.stringify(data));
};

// Get 2FA data from localStorage
export const getTwoFactorData = (): TwoFactorData => {
  const stored = localStorage.getItem('two-factor-auth');
  if (stored) {
    return JSON.parse(stored);
  }
  
  return { isEnabled: false };
};

// Enable 2FA for user
export const enableTwoFactor = async (secret: string, backupCodes: string[]): Promise<void> => {
  // Store 2FA settings securely in database
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Update both tables for compatibility
      await supabase.from('profiles').upsert({
        user_id: user.id,
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes,
        updated_at: new Date().toISOString()
      });

      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes,
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error enabling 2FA in database:', error);
  }
  
  // Also store locally for quick access
  const data: TwoFactorData = {
    isEnabled: true,
    secret,
    backupCodes,
    lastUsedAt: new Date().toISOString()
  };
  
  saveTwoFactorData(data);
};

// Disable 2FA for user (but keep secret for re-enabling)
export const disableTwoFactor = (): void => {
  const currentData = getTwoFactorData();
  const data: TwoFactorData = {
    isEnabled: false,
    secret: currentData.secret, // Keep the secret
    backupCodes: currentData.backupCodes, // Keep backup codes
    lastUsedAt: currentData.lastUsedAt
  };

  saveTwoFactorData(data);
};

// Re-enable 2FA using existing secret
export const reEnableTwoFactor = (): boolean => {
  const currentData = getTwoFactorData();

  if (!currentData.secret) {
    return false; // No existing secret, need full setup
  }

  const data: TwoFactorData = {
    isEnabled: true,
    secret: currentData.secret,
    backupCodes: currentData.backupCodes,
    lastUsedAt: new Date().toISOString()
  };

  saveTwoFactorData(data);
  return true;
};

// Check if 2FA is required for user
export const isTwoFactorRequired = (): boolean => {
  const data = getTwoFactorData();
  return data.isEnabled;
};

// Validate 2FA code (TOTP or backup)
export const validateTwoFactorCode = (
  code: string
): { isValid: boolean; type: 'totp' | 'backup' | 'invalid' } => {
  const data = getTwoFactorData();
  
  if (!data.isEnabled || !data.secret) {
    return { isValid: false, type: 'invalid' };
  }

  // Try TOTP first
  if (verifyTOTPCode(code, data.secret)) {
    // Update last used time
    saveTwoFactorData({
      ...data,
      lastUsedAt: new Date().toISOString()
    });
    return { isValid: true, type: 'totp' };
  }

  // Try backup codes
  if (data.backupCodes) {
    const backupResult = verifyBackupCode(code, data.backupCodes);
    if (backupResult.isValid) {
      // Update backup codes (remove used one)
      saveTwoFactorData({
        ...data,
        backupCodes: backupResult.remainingCodes,
        lastUsedAt: new Date().toISOString()
      });
      return { isValid: true, type: 'backup' };
    }
  }

  return { isValid: false, type: 'invalid' };
};

// Get remaining backup codes count
export const getRemainingBackupCodes = (): number => {
  const data = getTwoFactorData();
  return data.backupCodes?.length || 0;
};

// Regenerate backup codes
export const regenerateBackupCodes = (): string[] => {
  const data = getTwoFactorData();
  if (!data.isEnabled) {
    throw new Error('2FA is not enabled');
  }

  const newBackupCodes = generateBackupCodes();
  saveTwoFactorData({
    ...data,
    backupCodes: newBackupCodes
  });

  return newBackupCodes;
};

export default {
  generateTwoFactorSetup,
  generateBackupCodes,
  verifyTOTPCode,
  verifyBackupCode,
  getCurrentTOTPCode,
  saveTwoFactorData,
  getTwoFactorData,
  enableTwoFactor,
  disableTwoFactor,
  isTwoFactorRequired,
  validateTwoFactorCode,
  getRemainingBackupCodes,
  regenerateBackupCodes
};
