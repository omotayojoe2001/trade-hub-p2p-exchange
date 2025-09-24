// Mock credits service for demo purposes when database is not available
import { calculateCreditValue, CREDIT_VALUE_USD, MIN_CREDIT_PURCHASE } from './creditsService';

interface MockPurchase {
  id: string;
  user_id: string;
  crypto_type: 'BTC' | 'ETH';
  crypto_amount: number;
  credits_amount: number;
  payment_address: string;
  status: 'pending' | 'paid' | 'confirmed' | 'completed' | 'failed';
  created_at: string;
  usd_value: number;
}

interface MockTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'spend' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

class MockCreditsService {
  private userCredits: Map<string, number> = new Map();
  private purchases: Map<string, MockPurchase[]> = new Map();
  private transactions: Map<string, MockTransaction[]> = new Map();

  constructor() {
    // Initialize with some demo data
    this.userCredits.set('demo-user', 250); // Demo user starts with 250 credits ($2.50)
  }

  async getUserCredits(userId: string): Promise<number> {
    return this.userCredits.get(userId) || 0;
  }

  async createPurchase(
    userId: string, 
    credits: number, 
    cryptoType: 'BTC' | 'ETH'
  ): Promise<{ success: boolean; purchase?: MockPurchase; error?: string }> {
    
    const validation = this.validatePurchaseAmount(credits);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    const cryptoAmount = this.calculateCryptoAmount(credits, cryptoType);
    const address = this.generateMockAddress(cryptoType);
    
    const purchase: MockPurchase = {
      id: `purchase-${Date.now()}`,
      user_id: userId,
      crypto_type: cryptoType,
      crypto_amount: cryptoAmount,
      credits_amount: credits,
      payment_address: address,
      status: 'pending',
      created_at: new Date().toISOString(),
      usd_value: credits * CREDIT_VALUE_USD
    };

    // Store purchase
    const userPurchases = this.purchases.get(userId) || [];
    userPurchases.unshift(purchase);
    this.purchases.set(userId, userPurchases);

    return { success: true, purchase };
  }

  async simulatePayment(purchaseId: string, userId: string): Promise<boolean> {
    const userPurchases = this.purchases.get(userId) || [];
    const purchase = userPurchases.find(p => p.id === purchaseId);
    
    if (!purchase) return false;

    // Simulate payment confirmation after 3 seconds
    setTimeout(() => {
      purchase.status = 'completed';
      
      // Add credits to user balance
      const currentCredits = this.userCredits.get(userId) || 0;
      this.userCredits.set(userId, currentCredits + purchase.credits_amount);
      
      // Add transaction record
      const transaction: MockTransaction = {
        id: `tx-${Date.now()}`,
        user_id: userId,
        type: 'purchase',
        amount: purchase.credits_amount,
        description: `Credit purchase confirmed - ${purchase.credits_amount} credits ($${purchase.usd_value.toFixed(2)})`,
        created_at: new Date().toISOString()
      };
      
      const userTransactions = this.transactions.get(userId) || [];
      userTransactions.unshift(transaction);
      this.transactions.set(userId, userTransactions);
      
      console.log(`Mock payment confirmed: ${purchase.credits_amount} credits added to user ${userId}`);
    }, 3000);

    return true;
  }

  async spendCredits(userId: string, amount: number, description: string): Promise<boolean> {
    const currentCredits = this.userCredits.get(userId) || 0;
    
    if (currentCredits < amount) {
      return false;
    }

    // Deduct credits
    this.userCredits.set(userId, currentCredits - amount);
    
    // Add transaction record
    const transaction: MockTransaction = {
      id: `tx-${Date.now()}`,
      user_id: userId,
      type: 'spend',
      amount: -amount,
      description,
      created_at: new Date().toISOString()
    };
    
    const userTransactions = this.transactions.get(userId) || [];
    userTransactions.unshift(transaction);
    this.transactions.set(userId, userTransactions);
    
    return true;
  }

  async getPurchaseHistory(userId: string): Promise<MockPurchase[]> {
    return this.purchases.get(userId) || [];
  }

  async getTransactionHistory(userId: string): Promise<MockTransaction[]> {
    return this.transactions.get(userId) || [];
  }

  calculateCryptoAmount(credits: number, cryptoType: 'BTC' | 'ETH'): number {
    const usdValue = credits * CREDIT_VALUE_USD;
    
    switch (cryptoType) {
      case 'BTC':
        return usdValue / 100000; // Assuming BTC = $100,000
      case 'ETH':
        return usdValue / 3500;   // Assuming ETH = $3,500
      default:
        return 0;
    }
  }

  validatePurchaseAmount(credits: number): { valid: boolean; message?: string } {
    if (credits < MIN_CREDIT_PURCHASE) {
      return {
        valid: false,
        message: `Minimum purchase is ${MIN_CREDIT_PURCHASE} credits ($${(MIN_CREDIT_PURCHASE * CREDIT_VALUE_USD).toFixed(2)})`
      };
    }
    
    if (credits > 100000) {
      return {
        valid: false,
        message: 'Maximum purchase is 100,000 credits ($1,000.00)'
      };
    }
    
    return { valid: true };
  }

  private generateMockAddress(cryptoType: 'BTC' | 'ETH'): string {
    const mockAddresses = {
      BTC: `tb1q${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      ETH: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`
    };
    
    return mockAddresses[cryptoType];
  }

  // Subscribe to credit changes (mock implementation)
  subscribeToCredits(userId: string, callback: (credits: number) => void) {
    // Poll for changes every 2 seconds
    const interval = setInterval(() => {
      const credits = this.userCredits.get(userId) || 0;
      callback(credits);
    }, 2000);

    return {
      unsubscribe: () => clearInterval(interval)
    };
  }
}

export const mockCreditsService = new MockCreditsService();

// Export for easy switching between mock and real service
export const isDemoMode = false; // Using real database and BitGo integration