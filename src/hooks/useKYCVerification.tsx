import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface KYCData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  idNumber: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  address: string;
  phoneNumber: string;
}

interface KYCStatus {
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  level: 1 | 2 | 3;
  submittedAt?: string;
  reviewedAt?: string;
  limits: {
    daily: number;
    monthly: number;
  };
}

export const useKYCVerification = () => {
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    status: 'incomplete',
    level: 1,
    limits: { daily: 100, monthly: 1000 },
  });
  const { toast } = useToast();

  const submitKYC = async (data: KYCData) => {
    setLoading(true);
    try {
      // Mock submission - in production, use KYC service API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setKycStatus({
        status: 'pending',
        level: 2,
        submittedAt: new Date().toISOString(),
        limits: { daily: 5000, monthly: 50000 },
      });

      toast({
        title: "KYC Submitted",
        description: "Your verification documents have been submitted for review",
      });

      // Mock approval after 5 seconds for demo
      setTimeout(() => {
        setKycStatus(prev => ({
          ...prev,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
        }));
        toast({
          title: "KYC Approved",
          description: "Your identity has been verified successfully",
        });
      }, 5000);

      return true;
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit KYC documents",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = () => {
    return kycStatus;
  };

  const getRequiredDocuments = (level: number) => {
    const requirements = {
      1: ['Phone verification'],
      2: ['Government ID', 'Proof of address'],
      3: ['Enhanced verification', 'Source of funds', 'Video call'],
    };
    return requirements[level as keyof typeof requirements] || [];
  };

  return {
    loading,
    kycStatus,
    submitKYC,
    checkStatus,
    getRequiredDocuments,
  };
};