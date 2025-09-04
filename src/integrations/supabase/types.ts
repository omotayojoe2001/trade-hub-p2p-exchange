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
      merchant_ratings: {
        Row: {
          communication_rating: number | null
          created_at: string | null
          customer_id: string | null
          feedback_text: string | null
          id: string
          merchant_id: string | null
          overall_rating: number | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          backup_codes: string[] | null
          bio: string | null
          bvn: string | null
          created_at: string | null
          date_of_birth: string | null
          deactivated_at: string | null
          display_name: string | null
          is_active: boolean | null
          is_merchant: boolean | null
          location: string | null
          occupation: string | null
          phone_number: string | null
          profile_completed: boolean | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
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
          date_of_birth?: string | null
          deactivated_at?: string | null
          display_name?: string | null
          is_active?: boolean | null
          is_merchant?: boolean | null
          location?: string | null
          occupation?: string | null
          phone_number?: string | null
          profile_completed?: boolean | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
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
          date_of_birth?: string | null
          deactivated_at?: string | null
          display_name?: string | null
          is_active?: boolean | null
          is_merchant?: boolean | null
          location?: string | null
          occupation?: string | null
          phone_number?: string | null
          profile_completed?: boolean | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
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
          accepted_at: string | null
          amount: number
          bank_details: Json | null
          cash_amount: number
          completed_at: string | null
          created_at: string | null
          crypto_type: string
          direction: string
          expires_at: string | null
          id: string
          last_action_timestamp: string | null
          merchant_id: string | null
          merchant_rate: number | null
          net_amount: number | null
          platform_fee_amount: number | null
          platform_fee_percentage: number | null
          rate: number
          request_data: Json | null
          request_step: number | null
          selected_merchant_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          amount: number
          bank_details?: Json | null
          cash_amount: number
          completed_at?: string | null
          created_at?: string | null
          crypto_type: string
          direction: string
          expires_at?: string | null
          id?: string
          last_action_timestamp?: string | null
          merchant_id?: string | null
          merchant_rate?: number | null
          net_amount?: number | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          rate: number
          request_data?: Json | null
          request_step?: number | null
          selected_merchant_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          bank_details?: Json | null
          cash_amount?: number
          completed_at?: string | null
          created_at?: string | null
          crypto_type?: string
          direction?: string
          expires_at?: string | null
          id?: string
          last_action_timestamp?: string | null
          merchant_id?: string | null
          merchant_rate?: number | null
          net_amount?: number | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          rate?: number
          request_data?: Json | null
          request_step?: number | null
          selected_merchant_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          bank_account_details: Json | null
          buyer_id: string
          coin_type: string
          completed_at: string | null
          completion_time: unknown | null
          created_at: string | null
          dispute_reason: string | null
          escrow_address: string | null
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
          bank_account_details?: Json | null
          buyer_id: string
          coin_type: string
          completed_at?: string | null
          completion_time?: unknown | null
          created_at?: string | null
          dispute_reason?: string | null
          escrow_address?: string | null
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
          bank_account_details?: Json | null
          buyer_id?: string
          coin_type?: string
          completed_at?: string | null
          completion_time?: unknown | null
          created_at?: string | null
          dispute_reason?: string | null
          escrow_address?: string | null
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
          seller_id?: string
          status?: string
          trade_data?: Json | null
          trade_request_id?: string | null
          trade_step?: number | null
          trade_type?: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_agent: {
        Args: { delivery_location: string; delivery_type: string }
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
      generate_tracking_code: {
        Args: { delivery_type: string }
        Returns: string
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
      update_merchant_ratings: {
        Args: { merchant_user_id: string }
        Returns: undefined
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
