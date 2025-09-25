// Trade and payment method constants for better maintainability

export const PAYMENT_METHODS = {
  CASH_DELIVERY: 'cash_delivery',
  CASH_PICKUP: 'cash_pickup',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_MONEY: 'mobile_money'
} as const;

export const TRADE_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  SELL_FOR_CASH: 'sell_for_cash'
} as const;

export const TRADE_STATUS = {
  PENDING: 'pending',
  OPEN: 'open',
  ACCEPTED: 'accepted',
  PAYMENT_SENT: 'payment_sent',
  CASH_DELIVERED: 'cash_delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
} as const;

export const CASH_TRADE_STATUS = {
  PENDING_ACCEPTANCE: 'pending_acceptance',
  BUYER_FOUND: 'buyer_found',
  VENDOR_PAID: 'vendor_paid',
  CASH_DELIVERED: 'cash_delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const NOTIFICATION_TYPES = {
  TRADE_REQUEST: 'trade_request',
  TRADE_UPDATE: 'trade_update',
  CASH_PAYMENT_RECEIVED: 'cash_payment_received',
  CASH_DELIVERED: 'cash_delivered',
  CRYPTO_RELEASED: 'crypto_released'
} as const;