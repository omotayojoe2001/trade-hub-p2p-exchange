// Youverify Webhook Handler Utility
// This is an example of how to handle Youverify webhooks on your backend

import crypto from 'crypto';

const WEBHOOK_SIGNING_KEY = 'yeehTmSXy6hQ55iTwKTcrN3LMAP8UYLRzWVl';

interface YouverifyWebhookPayload {
  event: string;
  data: {
    id: string;
    method: string;
    status: string;
    components: string[];
    faceImage?: string;
    livenessClip?: string;
    passed: boolean;
    businessId: string;
    requestedAt: string;
    createdAt: string;
    lastModifiedAt: string;
    metadata?: any;
  };
}

/**
 * Verify the webhook signature from Youverify
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = WEBHOOK_SIGNING_KEY
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Process Youverify webhook payload
 */
export function processYouverifyWebhook(payload: YouverifyWebhookPayload) {
  const { event, data } = payload;

  switch (event) {
    case 'verification.completed':
      return handleVerificationCompleted(data);
    
    case 'verification.failed':
      return handleVerificationFailed(data);
    
    case 'verification.pending':
      return handleVerificationPending(data);
    
    default:
      console.log('Unknown webhook event:', event);
      return { success: false, message: 'Unknown event type' };
  }
}

function handleVerificationCompleted(data: any) {
  console.log('Verification completed:', data);
  
  // Update user verification status in your database
  // Example:
  // await updateUserVerificationStatus(data.metadata.userId, {
  //   status: 'verified',
  //   verificationId: data.id,
  //   verifiedAt: data.lastModifiedAt,
  //   faceImage: data.faceImage,
  //   passed: data.passed
  // });

  return { success: true, message: 'Verification completed successfully' };
}

function handleVerificationFailed(data: any) {
  console.log('Verification failed:', data);
  
  // Update user verification status in your database
  // Example:
  // await updateUserVerificationStatus(data.metadata.userId, {
  //   status: 'failed',
  //   verificationId: data.id,
  //   failedAt: data.lastModifiedAt,
  //   reason: 'Face verification failed'
  // });

  return { success: true, message: 'Verification failure processed' };
}

function handleVerificationPending(data: any) {
  console.log('Verification pending:', data);
  
  // Update user verification status in your database
  // Example:
  // await updateUserVerificationStatus(data.metadata.userId, {
  //   status: 'pending',
  //   verificationId: data.id,
  //   submittedAt: data.requestedAt
  // });

  return { success: true, message: 'Verification pending status updated' };
}

/**
 * Example Express.js webhook endpoint
 */
export const webhookEndpointExample = `
// Example Express.js webhook endpoint
app.post('/webhooks/youverify', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-youverify-signature'] as string;
  const payload = req.body.toString();

  // Verify the webhook signature
  if (!verifyWebhookSignature(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const webhookPayload = JSON.parse(payload);
    const result = processYouverifyWebhook(webhookPayload);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
`;

/**
 * Example Supabase Edge Function for webhook handling
 */
export const supabaseEdgeFunctionExample = `
// Example Supabase Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('x-youverify-signature')
  const payload = await req.text()

  // Verify signature
  if (!verifyWebhookSignature(payload, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const webhookPayload = JSON.parse(payload)
  const result = processYouverifyWebhook(webhookPayload)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
`;

export default {
  verifyWebhookSignature,
  processYouverifyWebhook,
  webhookEndpointExample,
  supabaseEdgeFunctionExample
};
