export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          location: string
          name: string
          phone: string
          rating: number | null
          specialties: string[] | null
          status: string
          total_deliveries: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          location: string
          name: string
          phone: string
          rating?: number | null
          specialties?: string[] | null
          status?: string
          total_deliveries?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string
          name?: string
          phone?: string
          rating?: number | null
          specialties?: string[] | null
          status?: string
          total_deliveries?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_order_tracking: {
        Row: {
          completed_at: string | null
          contact_details: Json | null
          created_at: string | null
          delivery_details: Json | null
          id: string
          naira_amount: number
          order_type: string
          payment_proof_url: string | null
          service_fee: number
          status: string | null
          tracking_code: string
          updated_at: string | null
          usd_amount: number
          user_id: string
          vendor_confirmed_at: string | null
          vendor_job_id: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_details?: Json | null
          created_at?: string | null
          delivery_details?: Json | null
          id?: string
          naira_amount: number
          order_type: string
          payment_proof_url?: string | null
          service_fee?: number
          status?: string | null
          tracking_code: string
          updated_at?: string | null
          usd_amount: number
          user_id: string
          vendor_confirmed_at?: string | null
          vendor_job_id?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_details?: Json | null
          created_at?: string | null
          delivery_details?: Json | null
          id?: string
          naira_amount?: number
          order_type?: string
          payment_proof_url?: string | null
          service_fee?: number
          status?: string | null
          tracking_code?: string
          updated_at?: string | null
          usd_amount?: number
          user_id?: string
          vendor_confirmed_at?: string | null
          vendor_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_order_tracking_vendor_job_id_fkey"
            columns: ["vendor_job_id"]
            isOneToOne: false
            referencedRelation: "vendor_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_purchase_transactions: {
        Row: {
          created_at: string | null
          credits_amount: number
          id: string
          payment_proof_url: string | null
          payment_reference: string | null
          price_paid_naira: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_amount: number
          id?: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          price_paid_naira: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_amount?: number
          id?: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          price_paid_naira?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crypto_wallets: {
        Row: {
          available_balance: number | null
          coin_type: string
          created_at: string | null
          deposit_address: string
          id: string
          pending_balance: number | null
          total_balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          coin_type: string
          created_at?: string | null
          deposit_address: string
          id?: string
          pending_balance?: number | null
          total_balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number | null
          coin_type?: string
          created_at?: string | null
          deposit_address?: string
          id?: string
          pending_balance?: number | null
          total_balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          agent_phone: string | null
          amount: number
          completed_at: string | null
          created_at: string | null
          crypto_amount: number
          crypto_type: string
          currency: string
          current_location: string | null
          delivery_address: string | null
          delivery_type: string
          estimated_arrival: string | null
          id: string
          metadata: Json | null
          pickup_location: string | null
          status: string
          timeline: Json | null
          tracking_code: string
          trade_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string | null
          crypto_amount: number
          crypto_type: string
          currency: string
          current_location?: string | null
          delivery_address?: string | null
          delivery_type: string
          estimated_arrival?: string | null
          id?: string
          metadata?: Json | null
          pickup_location?: string | null
          status?: string
          timeline?: Json | null
          tracking_code: string
          trade_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          crypto_amount?: number
          crypto_type?: string
          currency?: string
          current_location?: string | null
          delivery_address?: string | null
          delivery_type?: string
          estimated_arrival?: string | null
          id?: string
          metadata?: Json | null
          pickup_location?: string | null
          status?: string
          timeline?: Json | null
          tracking_code?: string
          trade_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      merchant_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          merchant_id: string
          trade_request_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          merchant_id: string
          trade_request_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          merchant_id?: string
          trade_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_notifications_trade_request_id_fkey"
            columns: ["trade_request_id"]
            isOneToOne: false
            referencedRelation: "trade_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_ratings: {
        Row: {
          communication_rating: number | null
          created_at: string | null
          customer_id: string | null
          feedback_text: string | null
          id: string
          merchant_id: string | null
          overall_rating: number | null
          rating: number | null
          reliability_rating: number | null
          speed_rating: number | null
          trade_id: string | null
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string | null
          customer_id?: string | null
          feedback_text?: string | null
          id?: string
          merchant_id?: string | null
          overall_rating?: number | null
          rating?: number | null
          reliability_rating?: number | null
          speed_rating?: number | null
          trade_id?: string | null
        }
        Update: {
          communication_rating?: number | null
          created_at?: string | null
          customer_id?: string | null
          feedback_text?: string | null
          id?: string
          merchant_id?: string | null
          overall_rating?: number | null
          rating?: number | null
          reliability_rating?: number | null
          speed_rating?: number | null
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_ratings_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_settings: {
        Row: {
          accepts_new_trades: boolean | null
          auto_accept_trades: boolean | null
          auto_release_escrow: boolean | null
          avg_response_time_minutes: number | null
          btc_buy_rate: number | null
          btc_sell_rate: number | null
          created_at: string | null
          eth_buy_rate: number | null
          eth_sell_rate: number | null
          id: string
          is_online: boolean | null
          max_trade_amount: number | null
          min_trade_amount: number | null
          payment_methods: string[] | null
          updated_at: string | null
          usdt_buy_rate: number | null
          usdt_sell_rate: number | null
          user_id: string | null
        }
        Insert: {
          accepts_new_trades?: boolean | null
          auto_accept_trades?: boolean | null
          auto_release_escrow?: boolean | null
          avg_response_time_minutes?: number | null
          btc_buy_rate?: number | null
          btc_sell_rate?: number | null
          created_at?: string | null
          eth_buy_rate?: number | null
          eth_sell_rate?: number | null
          id?: string
          is_online?: boolean | null
          max_trade_amount?: number | null
          min_trade_amount?: number | null
          payment_methods?: string[] | null
          updated_at?: string | null
          usdt_buy_rate?: number | null
          usdt_sell_rate?: number | null
          user_id?: string | null
        }
        Update: {
          accepts_new_trades?: boolean | null
          auto_accept_trades?: boolean | null
          auto_release_escrow?: boolean | null
          avg_response_time_minutes?: number | null
          btc_buy_rate?: number | null
          btc_sell_rate?: number | null
          created_at?: string | null
          eth_buy_rate?: number | null
          eth_sell_rate?: number | null
          id?: string
          is_online?: boolean | null
          max_trade_amount?: number | null
          min_trade_amount?: number | null
          payment_methods?: string[] | null
          updated_at?: string | null
          usdt_buy_rate?: number | null
          usdt_sell_rate?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          read: boolean | null
          receiver_id: string
          sender_id: string
          trade_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          read?: boolean | null
          receiver_id: string
          sender_id: string
          trade_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
          trade_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_code: string | null
          bank_name: string | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_verified: boolean | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_verified?: boolean | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_verified?: boolean | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      premium_trade_codes: {
        Row: {
          amount_naira: number
          amount_usd: number
          code: string
          created_at: string | null
          delivery_type: string
          expires_at: string | null
          id: string
          premium_user_id: string
          status: string
          trade_id: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_job_id: string | null
          verified_at: string | null
        }
        Insert: {
          amount_naira: number
          amount_usd: number
          code: string
          created_at?: string | null
          delivery_type: string
          expires_at?: string | null
          id?: string
          premium_user_id: string
          status?: string
          trade_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_job_id?: string | null
          verified_at?: string | null
        }
        Update: {
          amount_naira?: number
          amount_usd?: number
          code?: string
          created_at?: string | null
          delivery_type?: string
          expires_at?: string | null
          id?: string
          premium_user_id?: string
          status?: string
          trade_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_job_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_trade_codes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_trade_codes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_trade_codes_vendor_job_id_fkey"
            columns: ["vendor_job_id"]
            isOneToOne: false
            referencedRelation: "vendor_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          backup_codes: string[] | null
          bio: string | null
          bvn: string | null
          created_at: string | null
          credits_balance: number | null
          date_of_birth: string | null
          deactivated_at: string | null
          display_name: string | null
          is_active: boolean | null
          is_merchant: boolean | null
          is_premium: boolean | null
          location: string | null
          merchant_mode: boolean | null
          occupation: string | null
          phone_number: string | null
          profile_completed: boolean | null
          rating: number | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          bio?: string | null
          bvn?: string | null
          created_at?: string | null
          credits_balance?: number | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          display_name?: string | null
          is_active?: boolean | null
          is_merchant?: boolean | null
          is_premium?: boolean | null
          location?: string | null
          merchant_mode?: boolean | null
          occupation?: string | null
          phone_number?: string | null
          profile_completed?: boolean | null
          rating?: number | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          bio?: string | null
          bvn?: string | null
          created_at?: string | null
          credits_balance?: number | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          display_name?: string | null
          is_active?: boolean | null
          is_merchant?: boolean | null
          is_premium?: boolean | null
          location?: string | null
          merchant_mode?: boolean | null
          occupation?: string | null
          phone_number?: string | null
          profile_completed?: boolean | null
          rating?: number | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          receipt_data: Json
          receipt_type: string
          trade_id: string
          trade_request_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          receipt_data: Json
          receipt_type: string
          trade_id: string
          trade_request_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          receipt_data?: Json
          receipt_type?: string
          trade_id?: string
          trade_request_id?: string | null
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          created_at: string | null
          currency: string
          id: string
          paid_at: string | null
          referred_user_id: string
          referrer_id: string
          status: string
          trade_id: string | null
        }
        Insert: {
          commission_amount: number
          commission_rate?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          paid_at?: string | null
          referred_user_id: string
          referrer_id: string
          status?: string
          trade_id?: string | null
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          paid_at?: string | null
          referred_user_id?: string
          referrer_id?: string
          status?: string
          trade_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string | null
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      system_rates: {
        Row: {
          buy_rate: number
          currency_pair: string
          id: string
          last_updated: string | null
          sell_rate: number
          updated_by: string | null
        }
        Insert: {
          buy_rate: number
          currency_pair: string
          id?: string
          last_updated?: string | null
          sell_rate: number
          updated_by?: string | null
        }
        Update: {
          buy_rate?: number
          currency_pair?: string
          id?: string
          last_updated?: string | null
          sell_rate?: number
          updated_by?: string | null
        }
        Relationships: []
      }
      tracking_codes: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          status: string
          tracking_code: string
          trade_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          tracking_code: string
          trade_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          tracking_code?: string
          trade_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trade_progress: {
        Row: {
          amount: number | null
          coin_type: string
          created_at: string | null
          current_step: number | null
          expires_at: string | null
          id: string
          merchant_rate: number | null
          naira_amount: number | null
          selected_bank_account_id: string | null
          selected_merchant_id: string | null
          trade_data: Json | null
          trade_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          coin_type: string
          created_at?: string | null
          current_step?: number | null
          expires_at?: string | null
          id?: string
          merchant_rate?: number | null
          naira_amount?: number | null
          selected_bank_account_id?: string | null
          selected_merchant_id?: string | null
          trade_data?: Json | null
          trade_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          coin_type?: string
          created_at?: string | null
          current_step?: number | null
          expires_at?: string | null
          id?: string
          merchant_rate?: number | null
          naira_amount?: number | null
          selected_bank_account_id?: string | null
          selected_merchant_id?: string | null
          trade_data?: Json | null
          trade_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_progress_selected_bank_account_id_fkey"
            columns: ["selected_bank_account_id"]
            isOneToOne: false
            referencedRelation: "user_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_requests: {
        Row: {
          amount_crypto: number
          amount_fiat: number
          created_at: string | null
          crypto_type: string
          expires_at: string | null
          id: string
          merchant_id: string | null
          payment_method: string
          rate: number
          status: string | null
          trade_type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount_crypto: number
          amount_fiat: number
          created_at?: string | null
          crypto_type: string
          expires_at?: string | null
          id?: string
          merchant_id?: string | null
          payment_method: string
          rate: number
          status?: string | null
          trade_type: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount_crypto?: number
          amount_fiat?: number
          created_at?: string | null
          crypto_type?: string
          expires_at?: string | null
          id?: string
          merchant_id?: string | null
          payment_method?: string
          rate?: number
          status?: string | null
          trade_type?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          amount_crypto: number | null
          amount_fiat: number | null
          assigned_vendor_job_id: string | null
          bank_account_details: Json | null
          buyer_id: string
          cash_payment_confirmed_at: string | null
          coin_type: string
          completed_at: string | null
          completion_time: unknown | null
          created_at: string | null
          crypto_deposited_at: string | null
          crypto_released_at: string | null
          crypto_type: string | null
          dispute_reason: string | null
          escrow_address: string | null
          escrow_status: string | null
          escrow_vault_id: string | null
          expires_at: string | null
          id: string
          last_action_timestamp: string | null
          merchant_rate: number | null
          naira_amount: number
          net_amount: number | null
          payment_method: string
          payment_proof_url: string | null
          platform_fee_amount: number | null
          platform_fee_percentage: number | null
          rate: number
          receiver_wallet_address: string | null
          seller_id: string
          status: string
          trade_data: Json | null
          trade_request_id: string | null
          trade_step: number | null
          trade_type: string
          transaction_hash: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_crypto?: number | null
          amount_fiat?: number | null
          assigned_vendor_job_id?: string | null
          bank_account_details?: Json | null
          buyer_id: string
          cash_payment_confirmed_at?: string | null
          coin_type: string
          completed_at?: string | null
          completion_time?: unknown | null
          created_at?: string | null
          crypto_deposited_at?: string | null
          crypto_released_at?: string | null
          crypto_type?: string | null
          dispute_reason?: string | null
          escrow_address?: string | null
          escrow_status?: string | null
          escrow_vault_id?: string | null
          expires_at?: string | null
          id?: string
          last_action_timestamp?: string | null
          merchant_rate?: number | null
          naira_amount: number
          net_amount?: number | null
          payment_method: string
          payment_proof_url?: string | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          rate: number
          receiver_wallet_address?: string | null
          seller_id: string
          status?: string
          trade_data?: Json | null
          trade_request_id?: string | null
          trade_step?: number | null
          trade_type: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_crypto?: number | null
          amount_fiat?: number | null
          assigned_vendor_job_id?: string | null
          bank_account_details?: Json | null
          buyer_id?: string
          cash_payment_confirmed_at?: string | null
          coin_type?: string
          completed_at?: string | null
          completion_time?: unknown | null
          created_at?: string | null
          crypto_deposited_at?: string | null
          crypto_released_at?: string | null
          crypto_type?: string | null
          dispute_reason?: string | null
          escrow_address?: string | null
          escrow_status?: string | null
          escrow_vault_id?: string | null
          expires_at?: string | null
          id?: string
          last_action_timestamp?: string | null
          merchant_rate?: number | null
          naira_amount?: number
          net_amount?: number | null
          payment_method?: string
          payment_proof_url?: string | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          rate?: number
          receiver_wallet_address?: string | null
          seller_id?: string
          status?: string
          trade_data?: Json | null
          trade_request_id?: string | null
          trade_step?: number | null
          trade_type?: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_assigned_vendor_job_id_fkey"
            columns: ["assigned_vendor_job_id"]
            isOneToOne: false
            referencedRelation: "vendor_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string | null
          bank_name: string
          created_at: string | null
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code?: string | null
          bank_name: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          bank_accounts: Json | null
          created_at: string | null
          crypto_addresses: Json | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          kyc_status: string | null
          phone: string | null
          preferred_payment_methods: string[] | null
          premium_expires_at: string | null
          rating: number | null
          settings: Json | null
          success_rate: number | null
          total_volume: number | null
          trade_count: number | null
          updated_at: string | null
          user_id: string
          verification_level: string | null
        }
        Insert: {
          bank_accounts?: Json | null
          created_at?: string | null
          crypto_addresses?: Json | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          preferred_payment_methods?: string[] | null
          premium_expires_at?: string | null
          rating?: number | null
          settings?: Json | null
          success_rate?: number | null
          total_volume?: number | null
          trade_count?: number | null
          updated_at?: string | null
          user_id: string
          verification_level?: string | null
        }
        Update: {
          bank_accounts?: Json | null
          created_at?: string | null
          crypto_addresses?: Json | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          preferred_payment_methods?: string[] | null
          premium_expires_at?: string | null
          rating?: number | null
          settings?: Json | null
          success_rate?: number | null
          total_volume?: number | null
          trade_count?: number | null
          updated_at?: string | null
          user_id?: string
          verification_level?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          completed_steps: string[] | null
          created_at: string | null
          current_step: string | null
          expires_at: string | null
          id: string
          session_data: Json
          session_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          expires_at?: string | null
          id?: string
          session_data: Json
          session_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          expires_at?: string | null
          id?: string
          session_data?: Json
          session_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_activity_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          job_id: string | null
          meta: Json | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          meta?: Json | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          meta?: Json | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vendor_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_activity_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_jobs: {
        Row: {
          address_json: Json | null
          amount_naira_received: number | null
          amount_usd: number
          bank_tx_reference: string | null
          buyer_id: string | null
          cash_order_id: string | null
          code_expires_at: string | null
          code_generated_at: string | null
          completed_at: string | null
          created_at: string | null
          credits_deducted: boolean | null
          credits_required: number
          customer_notes: string | null
          customer_phone: string | null
          delivery_type: string
          fee_naira: number | null
          id: string
          last_message_at: string | null
          naira_amount_paid: number | null
          order_type: string | null
          payment_confirmed_at: string | null
          payment_proof_url: string | null
          payment_received_at: string | null
          premium_user_id: string
          status: string
          tracking_code: string | null
          trade_id: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_notes: string | null
          vendor_phone: string | null
          verification_code: string | null
          verification_code_hash: string | null
        }
        Insert: {
          address_json?: Json | null
          amount_naira_received?: number | null
          amount_usd: number
          bank_tx_reference?: string | null
          buyer_id?: string | null
          cash_order_id?: string | null
          code_expires_at?: string | null
          code_generated_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_deducted?: boolean | null
          credits_required?: number
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_type: string
          fee_naira?: number | null
          id?: string
          last_message_at?: string | null
          naira_amount_paid?: number | null
          order_type?: string | null
          payment_confirmed_at?: string | null
          payment_proof_url?: string | null
          payment_received_at?: string | null
          premium_user_id: string
          status?: string
          tracking_code?: string | null
          trade_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_notes?: string | null
          vendor_phone?: string | null
          verification_code?: string | null
          verification_code_hash?: string | null
        }
        Update: {
          address_json?: Json | null
          amount_naira_received?: number | null
          amount_usd?: number
          bank_tx_reference?: string | null
          buyer_id?: string | null
          cash_order_id?: string | null
          code_expires_at?: string | null
          code_generated_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_deducted?: boolean | null
          credits_required?: number
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_type?: string
          fee_naira?: number | null
          id?: string
          last_message_at?: string | null
          naira_amount_paid?: number | null
          order_type?: string | null
          payment_confirmed_at?: string | null
          payment_proof_url?: string | null
          payment_received_at?: string | null
          premium_user_id?: string
          status?: string
          tracking_code?: string | null
          trade_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_notes?: string | null
          vendor_phone?: string | null
          verification_code?: string | null
          verification_code_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_jobs_cash_order_id_fkey"
            columns: ["cash_order_id"]
            isOneToOne: false
            referencedRelation: "cash_order_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_jobs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_jobs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          message: string
          message_type: string | null
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          message: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          message?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "vendor_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          active: boolean | null
          bank_account: string
          bank_code: string | null
          bank_name: string
          created_at: string | null
          display_name: string
          id: string
          location_lat: number | null
          location_lng: number | null
          phone: string
          updated_at: string | null
          user_id: string | null
          working_hours: Json | null
        }
        Insert: {
          active?: boolean | null
          bank_account: string
          bank_code?: string | null
          bank_name: string
          created_at?: string | null
          display_name: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          phone: string
          updated_at?: string | null
          user_id?: string | null
          working_hours?: Json | null
        }
        Update: {
          active?: boolean | null
          bank_account?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string | null
          display_name?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          phone?: string
          updated_at?: string | null
          user_id?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      available_merchants: {
        Row: {
          completed_trades: number | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_merchant: boolean | null
          is_premium: boolean | null
          merchant_mode: boolean | null
          total_trades: number | null
        }
        Insert: {
          completed_trades?: never
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_merchant?: boolean | null
          is_premium?: boolean | null
          merchant_mode?: boolean | null
          total_trades?: never
        }
        Update: {
          completed_trades?: never
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_merchant?: boolean | null
          is_premium?: boolean | null
          merchant_mode?: boolean | null
          total_trades?: never
        }
        Relationships: []
      }
    }
    Functions: {
      assign_agent: {
        Args: { delivery_location: string; delivery_type: string }
        Returns: string
      }
      auto_match_trade_request: {
        Args: {
          p_amount_usd: number
          p_delivery_type: string
          p_premium_user_id: string
        }
        Returns: string
      }
      calculate_platform_fee: {
        Args: { fee_percentage?: number; naira_amount: number }
        Returns: number
      }
      clean_expired_trade_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_cash_order_with_vendor: {
        Args: {
          p_contact_details: Json
          p_delivery_details: Json
          p_naira_amount: number
          p_order_type: string
          p_service_fee: number
          p_usd_amount: number
          p_user_id: string
        }
        Returns: string
      }
      create_premium_trade_request: {
        Args:
          | {
              p_amount_crypto: number
              p_amount_fiat: number
              p_auto_match?: boolean
              p_crypto_type: string
              p_payment_method: string
              p_rate: number
              p_trade_type: string
              p_user_id: string
            }
          | {
              p_amount_usd: number
              p_delivery_type: string
              p_premium_user_id: string
            }
        Returns: {
          auto_matched: boolean
          matched_merchant_id: string
          message: string
          request_id: string
          trade_id: string
        }[]
      }
      create_premium_trade_with_vendor: {
        Args: {
          p_amount_usd: number
          p_delivery_address?: Json
          p_delivery_type: string
          p_premium_user_id: string
        }
        Returns: string
      }
      create_trade_request: {
        Args: {
          p_amount_crypto: number
          p_amount_fiat: number
          p_crypto_type: string
          p_payment_method: string
          p_rate: number
          p_trade_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_vendor_user: {
        Args: {
          p_bank_account: string
          p_bank_code?: string
          p_bank_name: string
          p_display_name: string
          p_email: string
          p_password: string
          p_phone: string
        }
        Returns: string
      }
      generate_cash_order_tracking_code: {
        Args: { order_type: string }
        Returns: string
      }
      generate_tracking_code: {
        Args: { delivery_type: string }
        Returns: string
      }
      generate_trade_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_trade_requests: {
        Args: { p_user_id: string }
        Returns: {
          amount_crypto: number
          amount_fiat: number
          created_at: string
          crypto_type: string
          id: string
          payment_method: string
          rate: number
          trade_type: string
          user_display_name: string
          user_id: string
        }[]
      }
      get_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_trade_messages: {
        Args: { trade_uuid: string; user_uuid: string }
        Returns: {
          content: string
          created_at: string
          id: string
          message_type: string
          read: boolean
          receiver_id: string
          sender_id: string
          sender_name: string
        }[]
      }
      get_user_recent_trades: {
        Args: { user_uuid: string }
        Returns: {
          amount: number
          coin_type: string
          created_at: string
          id: string
          naira_amount: number
          other_user_name: string
          other_user_rating: number
          status: string
          trade_type: string
        }[]
      }
      notify_merchant_of_trade: {
        Args: {
          p_amount_usd: number
          p_merchant_id: string
          p_trade_id: string
        }
        Returns: undefined
      }
      update_credit_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      update_merchant_ratings: {
        Args: { merchant_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "user" | "vendor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "vendor", "admin"],
    },
  },
} as const
