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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      background_surveys: {
        Row: {
          age_group: string | null
          country: string | null
          created_at: string
          education: string | null
          gender: string | null
          google_search_frequency: string | null
          id: string
          native_language: string | null
          product_research_familiarity: number | null
          session_id: string
          shopping_experience: number | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          gender?: string | null
          google_search_frequency?: string | null
          id?: string
          native_language?: string | null
          product_research_familiarity?: number | null
          session_id: string
          shopping_experience?: number | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          gender?: string | null
          google_search_frequency?: string | null
          id?: string
          native_language?: string | null
          product_research_familiarity?: number | null
          session_id?: string
          shopping_experience?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_surveys_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_queries: {
        Row: {
          complexity: number | null
          created_at: string
          id: string
          query_text: string
          reformulation_count: number | null
          session_id: string
          structure_type: string | null
          timestamp: string
          updated_at: string
        }
        Insert: {
          complexity?: number | null
          created_at?: string
          id?: string
          query_text: string
          reformulation_count?: number | null
          session_id: string
          structure_type?: string | null
          timestamp?: string
          updated_at?: string
        }
        Update: {
          complexity?: number | null
          created_at?: string
          id?: string
          query_text?: string
          reformulation_count?: number | null
          session_id?: string
          structure_type?: string | null
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          clicked_rank: number | null
          clicked_result_count: number | null
          clicked_url: string | null
          created_at: string
          follow_up_prompt: boolean | null
          id: string
          interaction_time: string
          query_id: string
          scroll_depth: number | null
          updated_at: string
        }
        Insert: {
          clicked_rank?: number | null
          clicked_result_count?: number | null
          clicked_url?: string | null
          created_at?: string
          follow_up_prompt?: boolean | null
          id?: string
          interaction_time?: string
          query_id: string
          scroll_depth?: number | null
          updated_at?: string
        }
        Update: {
          clicked_rank?: number | null
          clicked_result_count?: number | null
          clicked_url?: string | null
          created_at?: string
          follow_up_prompt?: boolean | null
          id?: string
          interaction_time?: string
          query_id?: string
          scroll_depth?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      post_survey: {
        Row: {
          created_at: string
          decision_factors: string | null
          decision_support: number | null
          id: string
          information_efficiency: number | null
          interface_comparison_rating: string | null
          interface_confidence: number | null
          interface_ease_of_use: number | null
          interface_familiarity: number | null
          interface_learnability: number | null
          interface_reuse_likelihood: number | null
          interface_usefulness: number | null
          price_range: string | null
          purchase_likelihood: string | null
          purchase_platform: string | null
          search_enjoyment: string | null
          search_satisfaction: number | null
          session_id: string
          smartphone_model: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision_factors?: string | null
          decision_support?: number | null
          id?: string
          information_efficiency?: number | null
          interface_comparison_rating?: string | null
          interface_confidence?: number | null
          interface_ease_of_use?: number | null
          interface_familiarity?: number | null
          interface_learnability?: number | null
          interface_reuse_likelihood?: number | null
          interface_usefulness?: number | null
          price_range?: string | null
          purchase_likelihood?: string | null
          purchase_platform?: string | null
          search_enjoyment?: string | null
          search_satisfaction?: number | null
          session_id: string
          smartphone_model?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision_factors?: string | null
          decision_support?: number | null
          id?: string
          information_efficiency?: number | null
          interface_comparison_rating?: string | null
          interface_confidence?: number | null
          interface_ease_of_use?: number | null
          interface_familiarity?: number | null
          interface_learnability?: number | null
          interface_reuse_likelihood?: number | null
          interface_usefulness?: number | null
          price_range?: string | null
          purchase_likelihood?: string | null
          purchase_platform?: string | null
          search_enjoyment?: string | null
          search_satisfaction?: number | null
          session_id?: string
          smartphone_model?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_survey_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          browser: string | null
          budget_range: string | null
          created_at: string
          device_type: string | null
          id: string
          location: string | null
          platform: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          budget_range?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          location?: string | null
          platform: string
          start_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          browser?: string | null
          budget_range?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          location?: string | null
          platform?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
