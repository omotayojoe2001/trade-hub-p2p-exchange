interface BitGoTransaction {
  id: string;
  coin: string;
  wallet: string;
  txid: string;
  date: string;
  type: string;
  value: number;
  valueString: string;
  feeString: string;
  payGoFeeString: string;
  usd: number;
  state: string;
  tags: string[];
  history: any[];
  comment: string;
  vSize: number;
  nSegwitInputs: number;
  nOutputs: number;
  nInputs: number;
  isFee: boolean;
  outputs: Array<{
    id: string;
    address: string;
    value: number;
    valueString: string;
    wallet: string;
    chain: number;
    index: number;
    redeemScript?: string;
    isSegwit: boolean;
  }>;
  entries: Array<{
    address: string;
    wallet: string;
    value: number;
    valueString: string;
  }>;
}

class BitGoService {
  private baseUrl = 'https://app.bitgo-test.com/api/v2';
  private accessToken = 'v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0';
  private btcWalletId = import.meta.env.VITE_BITGO_BTC_WALLET_ID;
  private ethWalletId = import.meta.env.VITE_BITGO_ETH_WALLET_ID;

  // Check if payment arrived at specific address
  async verifyPayment(
    coin: 'btc' | 'eth' | 'tbtc' | 'teth',
    expectedAddress: string,
    expectedAmount: number,
    transactionId?: string
  ): Promise<{
    success: boolean;
    transaction?: BitGoTransaction;
    actualAmount?: number;
    confirmations?: number;
    error?: string;
  }> {
    try {
      console.log(`🔍 Verifying ${coin.toUpperCase()} payment:`);
      console.log(`   📍 Address: ${expectedAddress}`);
      console.log(`   💰 Expected: ${expectedAmount}`);
      console.log(`   🆔 TX ID: ${transactionId || 'Any'}`);
      console.log(`   🔑 Token: ${this.accessToken ? 'Present' : 'Missing'}`);
      console.log(`   🏦 Wallet: ${coin.includes('btc') ? this.btcWalletId : this.ethWalletId}`);

      const walletId = coin.includes('btc') ? this.btcWalletId : this.ethWalletId;
      
      // Get wallet info first to check access
      const walletResponse = await fetch(
        `${this.baseUrl}/${coin}/wallet/${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`📡 Wallet API Response Status: ${walletResponse.status}`);
      
      if (!walletResponse.ok) {
        const errorText = await walletResponse.text();
        console.log(`❌ Wallet API Error Response: ${errorText}`);
        throw new Error(`BitGo Wallet API error: ${walletResponse.status} - ${errorText}`);
      }
      
      // Get recent transactions
      const response = await fetch(
        `${this.baseUrl}/${coin}/wallet/${walletId}/transfer`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`📡 Transfer API Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Transfer API Error Response: ${errorText}`);
        
        // If transfer endpoint fails, try alternative approach
        console.log('🔄 Transfer endpoint failed, trying wallet transactions...');
        
        const txResponse = await fetch(
          `${this.baseUrl}/${coin}/wallet/${walletId}/tx`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!txResponse.ok) {
          throw new Error(`BitGo API error: ${response.status} - ${errorText}`);
        }
        
        const txData = await txResponse.json();
        // Convert tx format to transfer format
        const data = {
          transfers: txData.transactions?.map((tx: any) => ({
            txid: tx.id,
            outputs: tx.outputs || [],
            state: tx.state,
            confirmations: tx.confirmations
          })) || []
        };
        
        console.log(`📊 Found ${data.transfers?.length || 0} recent transactions (via tx endpoint)`);
        return this.processTransfers(data, expectedAddress, expectedAmount, transactionId);
      }
      
      const data = await response.json();


      console.log(`📊 Found ${data.transfers?.length || 0} recent transactions`);
      
      return this.processTransfers(data, expectedAddress, expectedAmount, transactionId);
    } catch (error) {
      console.error('❌ BitGo verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private processTransfers(data: any, expectedAddress: string, expectedAmount: number, transactionId?: string) {
    try {
      // Look for matching transaction
      const transfers = data.transfers || [];
      
      for (const transfer of transfers) {
        // Check if transaction matches our criteria
        const matchesAddress = transfer.outputs?.some((output: any) => 
          output.address === expectedAddress
        );
        
        const matchesTxId = !transactionId || transfer.txid === transactionId;
        
        if (matchesAddress && matchesTxId) {
          // Calculate actual received amount
          const receivedOutput = transfer.outputs?.find((output: any) => 
            output.address === expectedAddress
          );
          
          const actualAmount = receivedOutput ? receivedOutput.value : 0;
          const amountMatches = Math.abs(actualAmount - expectedAmount) < 1000; // Allow small difference
          
          console.log(`✅ Payment found!`);
          console.log(`   💰 Received: ${actualAmount}`);
          console.log(`   ✔️ Amount OK: ${amountMatches}`);
          console.log(`   🔗 TX: ${transfer.txid}`);
          console.log(`   📊 State: ${transfer.state}`);

          return {
            success: amountMatches && transfer.state === 'confirmed',
            transaction: transfer,
            actualAmount,
            confirmations: transfer.confirmations || 0
          };
        }
      }

      console.log(`❌ No matching payment found`);
      return {
        success: false,
        error: 'Payment not found or amount mismatch'
      };
    } catch (error) {
      console.error('❌ Error processing transfers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get wallet balance
  async getWalletBalance(coin: 'btc' | 'eth' | 'tbtc' | 'teth'): Promise<{
    balance: number;
    confirmedBalance: number;
    spendableBalance: number;
  }> {
    try {
      const walletId = coin.includes('btc') ? this.btcWalletId : this.ethWalletId;
      
      const response = await fetch(
        `${this.baseUrl}/${coin}/wallet/${walletId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      return {
        balance: data.balance || 0,
        confirmedBalance: data.confirmedBalance || 0,
        spendableBalance: data.spendableBalance || 0
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return { balance: 0, confirmedBalance: 0, spendableBalance: 0 };
    }
  }

  // Generate new address for receiving payments
  async generateAddress(coin: 'btc' | 'eth' | 'tbtc' | 'teth'): Promise<{
    address?: string;
    error?: string;
  }> {
    try {
      const walletId = coin.includes('btc') ? this.btcWalletId : this.ethWalletId;
      
      const response = await fetch(
        `${this.baseUrl}/${coin}/wallet/${walletId}/address`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.address) {
        console.log(`🏠 Generated new ${coin.toUpperCase()} address: ${data.address}`);
        return { address: data.address };
      } else {
        return { error: 'Failed to generate address' };
      }
    } catch (error) {
      console.error('Error generating address:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const bitgoService = new BitGoService();