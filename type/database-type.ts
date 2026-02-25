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
      //  Chatbot Tables
      chatbot_agents: {
        Row: {
          id: string
          tenant_id: string
          name: string
          config: Json
          allowed_domains: string[]
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          config?: Json
          allowed_domains?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          config?: Json
          allowed_domains?: string[]
          created_at?: string
        }
        Relationships: []
      }
      chatbot_documents: {
        Row: {
          id: string
          tenant_id: string
          agent_id: string | null
          content: string
          embedding: number[] | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agent_id?: string | null
          content: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          agent_id?: string | null
          content?: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "chatbot_agents"
            referencedColumns: ["id"]
          }
        ]
      }
      api_endpoints: {
        Row: {
          created_at: string | null
          endpoint_name: string
          endpoint_url: string
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint_name: string
          endpoint_url: string
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint_name?: string
          endpoint_url?: string
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
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
      chat_logs: {
        Row: {
          created_at: string | null
          id: string
          intent: string | null
          message: string
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent?: string | null
          message: string
          response: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intent?: string | null
          message?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      endpoint_configs: {
        Row: {
          id: string
          base_url: string
          full_url: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          base_url: string
          full_url: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          base_url?: string
          full_url?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scraped_endpoints: {
        Row: {
          id: string
          config_id: string
          url: string
          label: string
          status: string
          source_url: string | null
          discovered_at: string
          created_at: string
        }
        Insert: {
          id?: string
          config_id: string
          url: string
          label: string
          status?: string
          source_url?: string | null
          discovered_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          config_id?: string
          url?: string
          label?: string
          status?: string
          source_url?: string | null
          discovered_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraped_endpoints_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "endpoint_configs"
            referencedColumns: ["id"]
          }
        ]
      }
      super_admin_roles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          permissions: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          permissions?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          permissions?: Json | null
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          password: string | null
          phone_no: string | null
          role_id: string | null
          status: boolean | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          password?: string | null
          phone_no?: string | null
          role_id?: string | null
          status?: boolean | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          password?: string | null
          phone_no?: string | null
          role_id?: string | null
          status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admins_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "super_admin_roles"
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
          query_embedding: number[]
          filter_agent_id: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          content: string
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
