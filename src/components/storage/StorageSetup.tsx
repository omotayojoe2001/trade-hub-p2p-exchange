import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKETS = [
  {
    name: 'chat-media',
    public: false,
    allowedMimeTypes: ['image/*', 'video/*', 'audio/*'],
    fileSizeLimit: 10485760 // 10MB
  },
  {
    name: 'receipts',
    public: false,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    fileSizeLimit: 5242880 // 5MB
  },
  {
    name: 'kyc-documents',
    public: false,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    fileSizeLimit: 10485760 // 10MB
  }
];

export const useStorageSetup = () => {
  useEffect(() => {
    const setupStorage = async () => {
      try {
        // Create storage buckets if they don't exist
        for (const bucket of STORAGE_BUCKETS) {
          const { error } = await supabase.storage.createBucket(bucket.name, {
            public: bucket.public,
            allowedMimeTypes: bucket.allowedMimeTypes,
            fileSizeLimit: bucket.fileSizeLimit
          });
          
          if (error && !error.message.includes('already exists')) {
            console.error(`Error creating bucket ${bucket.name}:`, error);
          }
        }
      } catch (error) {
        console.error('Error setting up storage:', error);
      }
    };

    setupStorage();
  }, []);
};