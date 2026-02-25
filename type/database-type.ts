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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_configs: {
        Row: {
          anthropic_api_key: string | null
          base_prompt: string | null
          created_at: string | null
          embedding_api_key: string | null
          gemini_api_key: string | null
          groq_api_key: string | null
          id: string
          model: string
          name: string
          openai_api_key: string | null
          project_id: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          anthropic_api_key?: string | null
          base_prompt?: string | null
          created_at?: string | null
          embedding_api_key?: string | null
          gemini_api_key?: string | null
          groq_api_key?: string | null
          id?: string
          model?: string
          name?: string
          openai_api_key?: string | null
          project_id: string
          provider?: string
          updated_at?: string | null
        }
        Update: {
          anthropic_api_key?: string | null
          base_prompt?: string | null
          created_at?: string | null
          embedding_api_key?: string | null
          gemini_api_key?: string | null
          groq_api_key?: string | null
          id?: string
          model?: string
          name?: string
          openai_api_key?: string | null
          project_id?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          allowed_domains: string[] | null
          config: Json | null
          created_at: string
          id: string
          name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          app_description: string | null
          app_name: string | null
          created_at: string
          dark_logo_url: string | null
          favicon_url: string | null
          id: string
          light_logo_url: string | null
        }
        Insert: {
          app_description?: string | null
          app_name?: string | null
          created_at?: string
          dark_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          light_logo_url?: string | null
        }
        Update: {
          app_description?: string | null
          app_name?: string | null
          created_at?: string
          dark_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          light_logo_url?: string | null
        }
        Relationships: []
      }
      chatbot_agents: {
        Row: {
          allowed_domains: string[] | null
          config: Json | null
          created_at: string
          id: string
          name: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          config?: Json | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_documents: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "chatbot_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_chunks: {
        Row: {
          content: string
          embedding: string | null
          endpoint_id: string | null
          id: string
          metadata: Json | null
          project_id: string
        }
        Insert: {
          content: string
          embedding?: string | null
          endpoint_id?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
        }
        Update: {
          content?: string
          embedding?: string | null
          endpoint_id?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_chunks_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "scraped_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoint_configs: {
        Row: {
          base_url: string
          created_at: string
          full_url: string
          id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          base_url: string
          created_at?: string
          full_url: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string
          full_url?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active_agent_config_id: string | null
          agent_config: Json | null
          created_at: string | null
          embed_token: string | null
          id: string
          name: string
          status: string | null
          target_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_agent_config_id?: string | null
          agent_config?: Json | null
          created_at?: string | null
          embed_token?: string | null
          id?: string
          name: string
          status?: string | null
          target_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_agent_config_id?: string | null
          agent_config?: Json | null
          created_at?: string | null
          embed_token?: string | null
          id?: string
          name?: string
          status?: string | null
          target_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_active_agent_config_id_fkey"
            columns: ["active_agent_config_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_endpoints: {
        Row: {
          auth_type: string | null
          id: string
          is_approved: boolean | null
          project_id: string
          requires_auth: boolean | null
          status: string | null
          type: string | null
          url: string
        }
        Insert: {
          auth_type?: string | null
          id?: string
          is_approved?: boolean | null
          project_id: string
          requires_auth?: boolean | null
          status?: string | null
          type?: string | null
          url: string
        }
        Update: {
          auth_type?: string | null
          id?: string
          is_approved?: boolean | null
          project_id?: string
          requires_auth?: boolean | null
          status?: string | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraped_endpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_deleted: boolean
          last_name: string | null
          password: string | null
          phone_no: string | null
          status: boolean
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean
          last_name?: string | null
          password?: string | null
          phone_no?: string | null
          status?: boolean
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean
          last_name?: string | null
          password?: string | null
          phone_no?: string | null
          status?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_chatbot_documents: {
        Args: {
          filter_agent_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_chunks: {
        Args: {
          match_count?: number
          match_project_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          endpoint_id: string
          id: string
          metadata: Json
          project_id: string
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          filter_agent_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_oai: {
        Args: {
          filter_agent_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
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
