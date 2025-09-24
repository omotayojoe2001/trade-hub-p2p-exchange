// Mock data utilities for development
export const mockFunctions = {
  get_merchant_payment_method: async () => ({
    bank_name: 'GTBank',
    account_number: '0123456789',
    account_name: 'John Doe'
  }),
  
  complete_trade: async () => ({
    success: true,
    message: 'Trade completed successfully'
  }),
  
  upload_payment_proof: async () => ({
    success: true,
    url: 'https://example.com/proof.jpg'
  }),
  
  get_user_display_name: async () => ({
    display_name: 'John Doe'
  })
};

export const mockTradeData = {
  crypto_sender_id: null,
  cash_sender_id: null,
  escrow_expires_at: null,
  payment_proof_uploaded_at: null,
  payment_hash: null
};