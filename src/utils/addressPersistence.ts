// Address persistence to prevent new addresses on page reload
const ADDRESS_STORAGE_KEY = 'trade_addresses';

interface StoredAddress {
  tradeId: string;
  coin: string;
  address: string;
  timestamp: number;
  expiresAt: number;
}

export const addressPersistence = {
  // Save address for a trade
  saveAddress(tradeId: string, coin: string, address: string): void {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
      let addresses: StoredAddress[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing address for this trade+coin
      addresses = addresses.filter(a => !(a.tradeId === tradeId && a.coin === coin));
      
      // Add new address with 24 hour expiry
      const now = Date.now();
      addresses.push({
        tradeId,
        coin,
        address,
        timestamp: now,
        expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours
      });
      
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
      console.log(`💾 Address saved: ${coin} for trade ${tradeId}`);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  },

  // Get existing address for a trade
  getAddress(tradeId: string, coin: string): string | null {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (!stored) return null;
      
      const addresses: StoredAddress[] = JSON.parse(stored);
      const now = Date.now();
      
      // Find non-expired address for this trade+coin
      const found = addresses.find(a => 
        a.tradeId === tradeId && 
        a.coin === coin && 
        a.expiresAt > now
      );
      
      if (found) {
        console.log(`🔄 Reusing existing ${coin} address for trade ${tradeId}`);
        return found.address;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  },

  // Clean expired addresses
  cleanExpired(): void {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (!stored) return;
      
      const addresses: StoredAddress[] = JSON.parse(stored);
      const now = Date.now();
      
      const validAddresses = addresses.filter(a => a.expiresAt > now);
      
      if (validAddresses.length !== addresses.length) {
        localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(validAddresses));
        console.log(`🧹 Cleaned ${addresses.length - validAddresses.length} expired addresses`);
      }
    } catch (error) {
      console.error('Error cleaning addresses:', error);
    }
  }
};