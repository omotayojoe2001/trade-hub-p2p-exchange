import { useState, useEffect, useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface BiometricCredential {
  id: string;
  name: string;
  created_at: string;
}

interface BiometricAuthState {
  isSupported: boolean;
  isEnrolled: boolean;
  loading: boolean;
  credentials: BiometricCredential[];
}

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricAuthState>({
    isSupported: false,
    isEnrolled: false,
    loading: true,
    credentials: []
  });
  const { toast } = useToast();

  // Check if WebAuthn is supported
  const checkSupport = useCallback(() => {
    const isSupported = window.PublicKeyCredential !== undefined;
    setState(prev => ({ ...prev, isSupported, loading: false }));
    return isSupported;
  }, []);

  // Check if user has enrolled biometric credentials
  const checkEnrollment = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check user metadata for biometric enrollment
      const hasEnrollment = user.user_metadata?.biometric_enrolled || false;
      setState(prev => ({ ...prev, isEnrolled: hasEnrollment }));
      return hasEnrollment;
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  }, []);

  // Register a new biometric credential
  const registerBiometric = useCallback(async (credentialName: string = 'Primary Device') => {
    if (!state.isSupported) {
      toast({
        title: "Not Supported",
        description: "Biometric authentication is not supported on this device",
        variant: "destructive"
      });
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create registration options
      const registrationOptions = {
        optionsJSON: {
          rp: {
            name: "Central Exchange",
            id: window.location.hostname,
          },
          user: {
            id: btoa(user.id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
            name: user.email || 'User',
            displayName: user.user_metadata?.display_name || user.email || 'User',
          },
          challenge: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          pubKeyCredParams: [
            { alg: -7, type: "public-key" as const },
            { alg: -257, type: "public-key" as const }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform" as const,
            userVerification: "required" as const,
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: "direct" as const
        }
      };

      // Start registration
      const credential = await startRegistration(registrationOptions);

      // Store credential info in user metadata
      await supabase.auth.updateUser({
        data: {
          biometric_enrolled: true,
          biometric_credential_id: credential.id,
          biometric_credential_name: credentialName
        }
      });

      setState(prev => ({ 
        ...prev, 
        isEnrolled: true,
        credentials: [...prev.credentials, {
          id: credential.id,
          name: credentialName,
          created_at: new Date().toISOString()
        }]
      }));

      toast({
        title: "Biometric Enrolled",
        description: "Biometric authentication has been successfully set up",
      });

      return true;
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register biometric authentication",
        variant: "destructive"
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.isSupported, toast]);

  // Authenticate using biometrics
  const authenticateWithBiometric = useCallback(async () => {
    if (!state.isSupported || !state.isEnrolled) {
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const credentialId = user.user_metadata?.biometric_credential_id;
      if (!credentialId) throw new Error('No biometric credential found');

      // Create authentication options
      const authenticationOptions = {
        optionsJSON: {
          challenge: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          allowCredentials: [{
            id: credentialId,
            type: "public-key" as const,
            transports: ["internal" as const]
          }],
          userVerification: "required" as const,
          timeout: 60000
        }
      };

      // Start authentication
      await startAuthentication(authenticationOptions);

      toast({
        title: "Authentication Successful",
        description: "Biometric authentication verified",
      });

      return true;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      toast({
        title: "Authentication Failed", 
        description: error.message || "Biometric authentication failed",
        variant: "destructive"
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.isSupported, state.isEnrolled, toast]);

  // Toggle biometric (preserve existing credentials)
  const toggleBiometric = useCallback(async (enable: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (enable) {
        // Check if user already has credentials
        const hasExistingCredential = user.user_metadata?.biometric_credential_id;
        
        if (hasExistingCredential) {
          // Just enable existing credential
          await supabase.auth.updateUser({
            data: {
              biometric_enrolled: true
            }
          });
          
          setState(prev => ({ ...prev, isEnrolled: true }));
          
          toast({
            title: "2FA Enabled",
            description: "Using your existing authenticator setup",
          });
          
          return true;
        } else {
          // Need to set up new credential
          return await registerBiometric('Primary Device');
        }
      } else {
        // Disable but keep credential for future use
        await supabase.auth.updateUser({
          data: {
            biometric_enrolled: false
            // Keep biometric_credential_id and biometric_credential_name
          }
        });

        setState(prev => ({ ...prev, isEnrolled: false }));

        toast({
          title: "2FA Disabled",
          description: "Your authenticator setup is preserved for future use",
        });

        return true;
      }
    } catch (error: any) {
      console.error('Error toggling biometric:', error);
      toast({
        title: "Toggle Failed",
        description: error.message || "Failed to toggle 2FA",
        variant: "destructive"
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [toast, registerBiometric]);

  // Remove biometric enrollment completely (for reset)
  const removeBiometric = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await supabase.auth.updateUser({
        data: {
          biometric_enrolled: false,
          biometric_credential_id: null,
          biometric_credential_name: null
        }
      });

      setState(prev => ({ 
        ...prev, 
        isEnrolled: false,
        credentials: []
      }));

      toast({
        title: "2FA Reset",
        description: "All authenticator data has been removed",
      });

      return true;
    } catch (error: any) {
      console.error('Error removing biometric:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset 2FA",
        variant: "destructive"
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  // Quick biometric login for returning users
  const quickBiometricLogin = useCallback(async (email: string) => {
    if (!state.isSupported) return false;

    try {
      setState(prev => ({ ...prev, loading: true }));

      // First, sign in normally to get user data
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'temp' // This will fail, but we just need to check if biometric is available
      });

      if (error && error.message.includes('biometric_available')) {
        // User has biometric enabled, proceed with biometric auth
        return await authenticateWithBiometric();
      }

      return false;
    } catch (error) {
      console.error('Quick biometric login error:', error);
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.isSupported, authenticateWithBiometric]);

  useEffect(() => {
    checkSupport();
    checkEnrollment();
  }, [checkSupport, checkEnrollment]);

  return {
    ...state,
    registerBiometric,
    authenticateWithBiometric,
    toggleBiometric,
    removeBiometric,
    quickBiometricLogin,
    checkSupport,
    checkEnrollment
  };
};