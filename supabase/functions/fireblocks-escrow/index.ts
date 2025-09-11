import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FireblocksConfig {
  apiKey: string
  privateKey: string
  baseUrl: string
}

interface VaultAccount {
  id: string
  name: string
  assetId: string
  balance: string
  address: string
}

interface TransferRequest {
  assetId: string
  source: {
    type: string
    id: string
  }
  destination: {
    type: string
    oneTimeAddress: {
      address: string
    }
  }
  amount: string
  note: string
}

class FireblocksService {
  private config: FireblocksConfig
  private supabase: any

  constructor(config: FireblocksConfig) {
    this.config = config
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
  }

  private generateMockAddress(assetId: string): string {
    // Generate mock addresses for different crypto types
    const addressPrefixes = {
      'BTC_TEST': 'tb1q',
      'ETH_TEST5': '0x',
      'USDT': '0x'
    }
    
    const prefix = addressPrefixes[assetId] || 'tb1q'
    const randomPart = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    
    return prefix + randomPart.substring(0, prefix === '0x' ? 38 : 32)
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any) {
    const url = `${this.config.baseUrl}${endpoint}`
    const timestamp = Date.now().toString()
    const nonce = crypto.randomUUID()
    
    const bodyString = body ? JSON.stringify(body) : ''
    const message = `${timestamp}${nonce}${method}${endpoint}${bodyString}`
    
    console.log('Fireblocks API request:', { endpoint, method, url })
    
    // Import the private key - handle different formats
    let privateKeyPem = this.config.privateKey
    
    // If the key doesn't have headers, add them
    if (!privateKeyPem.includes('-----BEGIN')) {
      privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`
    }
    
    const keyData = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
      .replace(/\n/g, '')
    
    // Validate base64 before decoding
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(keyData)) {
      throw new Error('Invalid private key format - not valid base64')
    }
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )
    
    const messageBuffer = new TextEncoder().encode(message)
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, messageBuffer)
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    
    const headers = {
      'X-API-Key': this.config.apiKey,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signatureBase64,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString || undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fireblocks API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  async createVaultAccount(name: string, assetId: string): Promise<VaultAccount> {
    const body = {
      name,
      hiddenOnUI: false,
      customerRefId: crypto.randomUUID()
    }
    
    const vault = await this.makeRequest('/vault/accounts', 'POST', body)
    
    // Generate deposit address for the asset
    const addressResponse = await this.makeRequest(
      `/vault/accounts/${vault.id}/${assetId}/addresses`,
      'POST',
      { description: `Escrow address for ${name}` }
    )
    
    return {
      id: vault.id,
      name: vault.name,
      assetId,
      balance: '0',
      address: addressResponse.address
    }
  }

  async getVaultAccount(vaultId: string): Promise<any> {
    return await this.makeRequest(`/vault/accounts/${vaultId}`)
  }

  async getVaultBalance(vaultId: string, assetId: string): Promise<string> {
    const response = await this.makeRequest(`/vault/accounts/${vaultId}/${assetId}`)
    return response.balance || '0'
  }

  async transferFunds(request: TransferRequest): Promise<any> {
    return await this.makeRequest('/transactions', 'POST', request)
  }

  async getTransactionStatus(txId: string): Promise<any> {
    return await this.makeRequest(`/transactions/${txId}`)
  }

  async createEscrowVault(tradeId: string, assetId: string): Promise<any> {
    try {
      console.log('Creating escrow vault for trade:', tradeId, 'asset:', assetId)
      
      // For development/testing, create a mock vault instead of calling Fireblocks
      const vaultName = `Escrow-${tradeId.slice(0, 8)}-${Date.now()}`
      
      // Generate a mock vault with test wallet address
      const mockVault = {
        id: `vault_${crypto.randomUUID()}`,
        name: vaultName,
        assetId,
        balance: '0',
        address: this.generateMockAddress(assetId)
      }
      
      console.log('Created mock vault:', mockVault)
      
      // Update trade_requests with vault information
      const { error } = await this.supabase
        .from('trade_requests')
        .update({
          escrow_address: mockVault.address,
          vault_id: mockVault.id
        })
        .eq('id', tradeId)

      if (error) throw error

      return {
        success: true,
        vault_id: mockVault.id,
        deposit_address: mockVault.address,
        asset_id: assetId
      }
    } catch (error) {
      console.error('Error creating escrow vault:', error)
      throw error
    }
  }

  async checkEscrowBalance(tradeId: string): Promise<any> {
    try {
      const { data: trade, error } = await this.supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeId)
        .single()

      if (error) throw error

      const vaultId = trade.vault_id
      const assetId = trade.crypto_type

      if (!vaultId || !assetId) {
        throw new Error('Vault not found for trade')
      }

      // For mock/development - simulate balance checking
      const expectedAmount = trade.amount_crypto || 0
      
      // Simulate that funds are received after 30 seconds for testing
      const tradeAge = Date.now() - new Date(trade.created_at).getTime()
      const hasReceivedFunds = tradeAge > 30000 // 30 seconds for testing
      const balance = hasReceivedFunds ? expectedAmount.toString() : '0'

      if (hasReceivedFunds && trade.status === 'crypto_deposited') {
        // Update trade status
        await this.supabase
          .from('trade_requests')
          .update({
            status: 'crypto_received'
          })
          .eq('id', tradeId)
      }

      return {
        success: true,
        balance,
        expected_amount: expectedAmount,
        has_received_funds: hasReceivedFunds,
        vault_id: vaultId
      }
    } catch (error) {
      console.error('Error checking escrow balance:', error)
      throw error
    }
  }

  async releaseFunds(tradeId: string, recipientAddress: string): Promise<any> {
    try {
      const { data: trade, error } = await this.supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeId)
        .single()

      if (error) throw error

      const vaultId = trade.vault_id
      const assetId = trade.crypto_type

      if (!vaultId || !assetId) {
        throw new Error('Vault not found for trade')
      }

      const transferRequest: TransferRequest = {
        assetId,
        source: {
          type: 'VAULT_ACCOUNT',
          id: vaultId
        },
        destination: {
          type: 'ONE_TIME_ADDRESS',
          oneTimeAddress: {
            address: recipientAddress
          }
        },
        amount: trade.amount_crypto.toString(),
        note: `Escrow release for trade ${tradeId}`
      }

      const transferResult = await this.transferFunds(transferRequest)

      // Update trade status
      await this.supabase
        .from('trade_requests')
        .update({
          status: 'completed'
        })
        .eq('id', tradeId)

      return {
        success: true,
        transaction_id: transferResult.id,
        recipient_address: recipientAddress
      }
    } catch (error) {
      console.error('Error releasing funds:', error)
      throw error
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, tradeId, assetId, recipientAddress } = await req.json()
    
    const apiKey = Deno.env.get('FIREBLOCKS_API_KEY') ?? ''
    const privateKey = Deno.env.get('FIREBLOCKS_PRIVATE_KEY') ?? ''
    
    console.log('Fireblocks config check:', {
      hasApiKey: !!apiKey,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey.length,
      privateKeyPreview: privateKey.substring(0, 50) + '...'
    })
    
    if (!apiKey || !privateKey) {
      throw new Error('Missing Fireblocks credentials')
    }
    
    const fireblocks = new FireblocksService({
      apiKey,
      privateKey,
      baseUrl: 'https://sandbox-api.fireblocks.io/v1'
    })

    let result

    switch (action) {
      case 'create_vault':
        result = await fireblocks.createEscrowVault(tradeId, assetId)
        break
      
      case 'check_balance':
        result = await fireblocks.checkEscrowBalance(tradeId)
        break
      
      case 'release_funds':
        result = await fireblocks.releaseFunds(tradeId, recipientAddress)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Fireblocks escrow error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})