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

  private async makeRequest(endpoint: string, method = 'GET', body?: any) {
    const url = `${this.config.baseUrl}${endpoint}`
    const timestamp = Date.now().toString()
    const nonce = crypto.randomUUID()
    
    const bodyString = body ? JSON.stringify(body) : ''
    const message = `${timestamp}${nonce}${method}${endpoint}${bodyString}`
    
    // Import the private key
    const privateKeyPem = this.config.privateKey
    const keyData = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
    
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
      const vaultName = `Escrow-${tradeId.slice(0, 8)}-${Date.now()}`
      const vault = await this.createVaultAccount(vaultName, assetId)
      
      // Update trade with vault information
      const { error } = await this.supabase
        .from('trades')
        .update({
          escrow_address: vault.address,
          escrow_status: 'vault_created',
          trade_data: {
            fireblocks_vault_id: vault.id,
            fireblocks_asset_id: assetId,
            vault_name: vaultName
          }
        })
        .eq('id', tradeId)

      if (error) throw error

      return {
        success: true,
        vault_id: vault.id,
        deposit_address: vault.address,
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
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single()

      if (error) throw error

      const tradeData = trade.trade_data || {}
      const vaultId = tradeData.fireblocks_vault_id
      const assetId = tradeData.fireblocks_asset_id

      if (!vaultId || !assetId) {
        throw new Error('Vault not found for trade')
      }

      const balance = await this.getVaultBalance(vaultId, assetId)
      const expectedAmount = trade.amount.toString()

      const hasReceivedFunds = parseFloat(balance) >= parseFloat(expectedAmount)

      if (hasReceivedFunds && trade.escrow_status === 'vault_created') {
        // Update trade status
        await this.supabase
          .from('trades')
          .update({
            escrow_status: 'crypto_received',
            status: 'pending_cash'
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
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single()

      if (error) throw error

      const tradeData = trade.trade_data || {}
      const vaultId = tradeData.fireblocks_vault_id
      const assetId = tradeData.fireblocks_asset_id

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
        amount: trade.amount.toString(),
        note: `Escrow release for trade ${tradeId}`
      }

      const transferResult = await this.transferFunds(transferRequest)

      // Update trade status
      await this.supabase
        .from('trades')
        .update({
          escrow_status: 'funds_released',
          status: 'completed',
          transaction_hash: transferResult.id,
          completed_at: new Date().toISOString()
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
    
    const fireblocks = new FireblocksService({
      apiKey: Deno.env.get('FIREBLOCKS_API_KEY') ?? '',
      privateKey: Deno.env.get('FIREBLOCKS_PRIVATE_KEY') ?? '',
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