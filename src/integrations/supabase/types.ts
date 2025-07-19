export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      crypto_wallets: {
        Row: {
          available_balance: number | null
          coin_type: string
          created_at: string
          deposit_address: string
          escrow_balance: number | null
          id: string
          private_key_encrypted: string | null
          updated_at: string
          user_id: string
          wallet_type: string
        }
        Insert: {
          available_balance?: number | null
          coin_type: string
          created_at?: string
          deposit_address: string
          escrow_balance?: number | null
          id?: string
          private_key_encrypted?: string | null
          updated_at?: string
          user_id: string
          wallet_type?: string
        }
        Update: {
          available_balance?: number | null
          coin_type?: string
          created_at?: string
          deposit_address?: string
          escrow_balance?: number | null
          id?: string
          private_key_encrypted?: string | null
          updated_at?: string
          user_id?: string
          wallet_type?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          coin_type: string
          created_at: string
          deposit_confirmed_at: string | null
          deposit_tx_hash: string | null
          escrow_address: string
          id: string
          release_confirmed_at: string | null
          release_tx_hash: string | null
          status: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          coin_type: string
          created_at?: string
          deposit_confirmed_at?: string | null
          deposit_tx_hash?: string | null
          escrow_address: string
          id?: string
          release_confirmed_at?: string | null
          release_tx_hash?: string | null
          status?: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          coin_type?: string
          created_at?: string
          deposit_confirmed_at?: string | null
          deposit_tx_hash?: string | null
          escrow_address?: string
          id?: string
          release_confirmed_at?: string | null
          release_tx_hash?: string | null
          status?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_ratings: {
        Row: {
          communication_rating: number | null
          created_at: string
          customer_id: string
          id: string
          merchant_id: string
          rating: number
          reliability_rating: number | null
          review_text: string | null
          speed_rating: number | null
          trade_id: string
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string
          customer_id: string
          id?: string
          merchant_id: string
          rating: number
          reliability_rating?: number | null
          review_text?: string | null
          speed_rating?: number | null
          trade_id: string
        }
        Update: {
          communication_rating?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          merchant_id?: string
          rating?: number
          reliability_rating?: number | null
          review_text?: string | null
          speed_rating?: number | null
          trade_id?: string
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
          created_at: string
          id: string
          is_online: boolean | null
          max_trade_amount: number | null
          merchant_type: string
          min_trade_amount: number | null
          payment_methods: Json | null
          updated_at: string
          usdt_buy_rate: number | null
          usdt_sell_rate: number | null
          user_id: string
        }
        Insert: {
          accepts_new_trades?: boolean | null
          auto_accept_trades?: boolean | null
          auto_release_escrow?: boolean | null
          avg_response_time_minutes?: number | null
          btc_buy_rate?: number | null
          btc_sell_rate?: number | null
          created_at?: string
          id?: string
          is_online?: boolean | null
          max_trade_amount?: number | null
          merchant_type?: string
          min_trade_amount?: number | null
          payment_methods?: Json | null
          updated_at?: string
          usdt_buy_rate?: number | null
          usdt_sell_rate?: number | null
          user_id: string
        }
        Update: {
          accepts_new_trades?: boolean | null
          auto_accept_trades?: boolean | null
          auto_release_escrow?: boolean | null
          avg_response_time_minutes?: number | null
          btc_buy_rate?: number | null
          btc_sell_rate?: number | null
          created_at?: string
          id?: string
          is_online?: boolean | null
          max_trade_amount?: number | null
          merchant_type?: string
          min_trade_amount?: number | null
          payment_methods?: Json | null
          updated_at?: string
          usdt_buy_rate?: number | null
          usdt_sell_rate?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_merchant: boolean | null
          phone_number: string | null
          profile_completed: boolean | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_merchant?: boolean | null
          phone_number?: string | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_merchant?: boolean | null
          phone_number?: string | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          status?: string | null
        }
        Relationships: []
      }
      trade_updates: {
        Row: {
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          trade_id: string
          updated_by: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          trade_id: string
          updated_by: string
        }
        Update: {
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          trade_id?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_updates_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          bank_account_details: Json | null
          buyer_id: string
          coin_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_demo: boolean | null
          naira_amount: number
          notes: string | null
          payment_method: string | null
          rate: number
          receipt_url: string | null
          seller_id: string | null
          status: string
          trade_type: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_details?: Json | null
          buyer_id: string
          coin_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          naira_amount: number
          notes?: string | null
          payment_method?: string | null
          rate: number
          receipt_url?: string | null
          seller_id?: string | null
          status?: string
          trade_type: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_details?: Json | null
          buyer_id?: string
          coin_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          naira_amount?: number
          notes?: string | null
          payment_method?: string | null
          rate?: number
          receipt_url?: string | null
          seller_id?: string | null
          status?: string
          trade_type?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_checkout_session: {
        Args: {
          amount_cents: number
          currency?: string
          success_url?: string
          cancel_url?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
