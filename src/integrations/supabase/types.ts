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
          created_at: string | null
          education: string | null
          gender: string | null
          google_search_frequency: string | null
          id: string
          native_language: string | null
          product_research_familiarity: number | null
          session_id: string
          shopping_experience: number | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          country?: string | null
          created_at?: string | null
          education?: string | null
          gender?: string | null
          google_search_frequency?: string | null
          id?: string
          native_language?: string | null
          product_research_familiarity?: number | null
          session_id: string
          shopping_experience?: number | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          country?: string | null
          created_at?: string | null
          education?: string | null
          gender?: string | null
          google_search_frequency?: string | null
          id?: string
          native_language?: string | null
          product_research_familiarity?: number | null
          session_id?: string
          shopping_experience?: number | null
          updated_at?: string | null
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
          created_at: string | null
          id: string
          previous_query_id: string | null
          query_order: number | null
          query_text: string
          reformulation_count: number | null
          session_id: string
          structure_type: string | null
          time_per_query: number | null
          timestamp: string | null
          updated_at: string | null
        }
        Insert: {
          complexity?: number | null
          created_at?: string | null
          id?: string
          previous_query_id?: string | null
          query_order?: number | null
          query_text: string
          reformulation_count?: number | null
          session_id: string
          structure_type?: string | null
          time_per_query?: number | null
          timestamp?: string | null
          updated_at?: string | null
        }
        Update: {
          complexity?: number | null
          created_at?: string | null
          id?: string
          previous_query_id?: string | null
          query_order?: number | null
          query_text?: string
          reformulation_count?: number | null
          session_id?: string
          structure_type?: string | null
          time_per_query?: number | null
          timestamp?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_queries_previous_query_id_fkey"
            columns: ["previous_query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_details: {
        Row: {
          element_id: string | null
          id: string
          interaction_id: string
          interaction_type: string | null
          timestamp: string | null
          value: string | null
        }
        Insert: {
          element_id?: string | null
          id?: string
          interaction_id: string
          interaction_type?: string | null
          timestamp?: string | null
          value?: string | null
        }
        Update: {
          element_id?: string | null
          id?: string
          interaction_id?: string
          interaction_type?: string | null
          timestamp?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interaction_details_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          clicked_rank: number | null
          clicked_result_count: number | null
          clicked_url: string | null
          created_at: string | null
          element_visibility: boolean | null
          follow_up_prompt: boolean | null
          hover_duration_ms: number | null
          id: string
          interaction_time: string | null
          query_id: string
          scroll_depth: number | null
          updated_at: string | null
        }
        Insert: {
          clicked_rank?: number | null
          clicked_result_count?: number | null
          clicked_url?: string | null
          created_at?: string | null
          element_visibility?: boolean | null
          follow_up_prompt?: boolean | null
          hover_duration_ms?: number | null
          id?: string
          interaction_time?: string | null
          query_id: string
          scroll_depth?: number | null
          updated_at?: string | null
        }
        Update: {
          clicked_rank?: number | null
          clicked_result_count?: number | null
          clicked_url?: string | null
          created_at?: string | null
          element_visibility?: boolean | null
          follow_up_prompt?: boolean | null
          hover_duration_ms?: number | null
          id?: string
          interaction_time?: string | null
          query_id?: string
          scroll_depth?: number | null
          updated_at?: string | null
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
          attention_check: number | null
          created_at: string | null
          google_ease: number | null
          google_open_feedback: string | null
          google_query_modifications: string | null
          google_relevance: number | null
          google_satisfaction: number | null
          google_trust: number | null
          id: string
          search_tool_type: string | null
          session_id: string
          task_duration: string | null
          updated_at: string | null
        }
        Insert: {
          attention_check?: number | null
          created_at?: string | null
          google_ease?: number | null
          google_open_feedback?: string | null
          google_query_modifications?: string | null
          google_relevance?: number | null
          google_satisfaction?: number | null
          google_trust?: number | null
          id?: string
          search_tool_type?: string | null
          session_id: string
          task_duration?: string | null
          updated_at?: string | null
        }
        Update: {
          attention_check?: number | null
          created_at?: string | null
          google_ease?: number | null
          google_open_feedback?: string | null
          google_query_modifications?: string | null
          google_relevance?: number | null
          google_satisfaction?: number | null
          google_trust?: number | null
          id?: string
          search_tool_type?: string | null
          session_id?: string
          task_duration?: string | null
          updated_at?: string | null
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
      query_timing_metrics: {
        Row: {
          id: string
          query_abandoned: boolean | null
          query_end_time: string | null
          query_id: string
          results_loaded_count: number | null
          search_duration_ms: number | null
          time_to_first_click_ms: number | null
          time_to_first_result: number | null
          timestamp: string | null
          user_clicked: boolean | null
          user_scrolled: boolean | null
        }
        Insert: {
          id?: string
          query_abandoned?: boolean | null
          query_end_time?: string | null
          query_id: string
          results_loaded_count?: number | null
          search_duration_ms?: number | null
          time_to_first_click_ms?: number | null
          time_to_first_result?: number | null
          timestamp?: string | null
          user_clicked?: boolean | null
          user_scrolled?: boolean | null
        }
        Update: {
          id?: string
          query_abandoned?: boolean | null
          query_end_time?: string | null
          query_id?: string
          results_loaded_count?: number | null
          search_duration_ms?: number | null
          time_to_first_click_ms?: number | null
          time_to_first_result?: number | null
          timestamp?: string | null
          user_clicked?: boolean | null
          user_scrolled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "query_timing_metrics_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      session_timing_summary: {
        Row: {
          avg_time_per_query: number | null
          avg_time_to_click: number | null
          clicks_per_query: number | null
          id: string
          idle_time_events: number | null
          min_max_time_per_query: string | null
          queries_per_minute: number | null
          session_id: string
          successful_queries: number | null
          total_clicks: number | null
          total_focus_time_ms: number | null
          total_scroll_distance_px: number | null
          total_searches: number | null
          total_session_duration_ms: number | null
        }
        Insert: {
          avg_time_per_query?: number | null
          avg_time_to_click?: number | null
          clicks_per_query?: number | null
          id?: string
          idle_time_events?: number | null
          min_max_time_per_query?: string | null
          queries_per_minute?: number | null
          session_id: string
          successful_queries?: number | null
          total_clicks?: number | null
          total_focus_time_ms?: number | null
          total_scroll_distance_px?: number | null
          total_searches?: number | null
          total_session_duration_ms?: number | null
        }
        Update: {
          avg_time_per_query?: number | null
          avg_time_to_click?: number | null
          clicks_per_query?: number | null
          id?: string
          idle_time_events?: number | null
          min_max_time_per_query?: string | null
          queries_per_minute?: number | null
          session_id?: string
          successful_queries?: number | null
          total_clicks?: number | null
          total_focus_time_ms?: number | null
          total_scroll_distance_px?: number | null
          total_searches?: number | null
          total_session_duration_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_timing_summary_session_id_fkey"
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
          created_at: string | null
          device_type: string | null
          id: string
          location: string | null
          platform: string
          session_duration: number | null
          start_time: string
          time_to_first_query: number | null
          total_queries: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          budget_range?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          location?: string | null
          platform: string
          session_duration?: number | null
          start_time?: string
          time_to_first_query?: number | null
          total_queries?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          budget_range?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          location?: string | null
          platform?: string
          session_duration?: number | null
          start_time?: string
          time_to_first_query?: number | null
          total_queries?: number | null
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
      validate_session_access: {
        Args: { session_uuid: string }
        Returns: boolean
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
