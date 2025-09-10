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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      background_survey: {
        Row: {
          device_type: string | null
          id: string
          ip_address: string | null
          participant_id: string
          responses: Json
          submitted_at: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id: string
          responses: Json
          submitted_at?: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id?: string
          responses?: Json
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_survey_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          device_type: string | null
          event_type: string
          id: string
          ip_address: string | null
          participant_id: string
          timestamp: string
        }
        Insert: {
          device_type?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          participant_id: string
          timestamp?: string
        }
        Update: {
          device_type?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          participant_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_participant_fk"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          device_type: string | null
          ip_address: string | null
          participant_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          ip_address?: string | null
          participant_id?: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          ip_address?: string | null
          participant_id?: string
        }
        Relationships: []
      }
      post_task_survey: {
        Row: {
          device_type: string | null
          id: string
          ip_address: string | null
          participant_id: string
          q19_topic_familiarity: number | null
          q20_google_satisfaction: number | null
          q21_google_ease: number | null
          q22_google_relevance: number | null
          q23_google_trust: number | null
          q24_contradictory_handling: string | null
          q25_tool_effectiveness: number | null
          q26_attention_check: number | null
          q27_first_response_satisfaction: number | null
          q28_task_duration: string | null
          q29_future_usage_feedback: string | null
          session_id: string
          submitted_at: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id: string
          q19_topic_familiarity?: number | null
          q20_google_satisfaction?: number | null
          q21_google_ease?: number | null
          q22_google_relevance?: number | null
          q23_google_trust?: number | null
          q24_contradictory_handling?: string | null
          q25_tool_effectiveness?: number | null
          q26_attention_check?: number | null
          q27_first_response_satisfaction?: number | null
          q28_task_duration?: string | null
          q29_future_usage_feedback?: string | null
          session_id: string
          submitted_at?: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id?: string
          q19_topic_familiarity?: number | null
          q20_google_satisfaction?: number | null
          q21_google_ease?: number | null
          q22_google_relevance?: number | null
          q23_google_trust?: number | null
          q24_contradictory_handling?: string | null
          q25_tool_effectiveness?: number | null
          q26_attention_check?: number | null
          q27_first_response_satisfaction?: number | null
          q28_task_duration?: string | null
          q29_future_usage_feedback?: string | null
          session_id?: string
          submitted_at?: string
        }
        Relationships: []
      }
      queries: {
        Row: {
          click_count: number | null
          created_at: string
          device_type: string | null
          end_time: string | null
          id: string
          ip_address: string | null
          query_duration_ms: number | null
          query_duration_sec: number | null
          query_order: number | null
          query_structure: string | null
          query_text: string | null
          session_id: string
          start_time: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          device_type?: string | null
          end_time?: string | null
          id?: string
          ip_address?: string | null
          query_duration_ms?: number | null
          query_duration_sec?: number | null
          query_order?: number | null
          query_structure?: string | null
          query_text?: string | null
          session_id: string
          start_time?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string
          device_type?: string | null
          end_time?: string | null
          id?: string
          ip_address?: string | null
          query_duration_ms?: number | null
          query_duration_sec?: number | null
          query_order?: number | null
          query_structure?: string | null
          query_text?: string | null
          session_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      query_clicks: {
        Row: {
          click_order: number | null
          click_time: string | null
          clicked_rank: number | null
          clicked_url: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          query_id: string
        }
        Insert: {
          click_order?: number | null
          click_time?: string | null
          clicked_rank?: number | null
          clicked_url?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          query_id: string
        }
        Update: {
          click_order?: number | null
          click_time?: string | null
          clicked_rank?: number | null
          clicked_url?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          query_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_clicks_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "queries"
            referencedColumns: ["id"]
          },
        ]
      }
      scroll_events: {
        Row: {
          device_type: string | null
          id: string
          ip_address: string | null
          max_scroll_pct: number
          path: string
          recorded_at: string
          session_id: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          max_scroll_pct: number
          path: string
          recorded_at?: string
          session_id: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          max_scroll_pct?: number
          path?: string
          recorded_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scroll_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      search_result_log: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          participant_id: string
          q12_smartphone_model: string | null
          q13_storage_capacity: string | null
          q14_color: string | null
          q15_lowest_price: string | null
          q16_website_link: string | null
          q17_price_importance: string | null
          q18_smartphone_features: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id: string
          q12_smartphone_model?: string | null
          q13_storage_capacity?: string | null
          q14_color?: string | null
          q15_lowest_price?: string | null
          q16_website_link?: string | null
          q17_price_importance?: string | null
          q18_smartphone_features?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id?: string
          q12_smartphone_model?: string | null
          q13_storage_capacity?: string | null
          q14_color?: string | null
          q15_lowest_price?: string | null
          q16_website_link?: string | null
          q17_price_importance?: string | null
          q18_smartphone_features?: string | null
          session_id?: string
        }
        Relationships: []
      }
      search_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          participant_id: string
          query_count: number | null
          query_reformulation_count: number | null
          scroll_depth_max: number | null
          session_duration_ms: number | null
          session_end_time: string | null
          session_start_time: string | null
          total_clicked_results_count: number | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id: string
          query_count?: number | null
          query_reformulation_count?: number | null
          scroll_depth_max?: number | null
          session_duration_ms?: number | null
          session_end_time?: string | null
          session_start_time?: string | null
          total_clicked_results_count?: number | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id?: string
          query_count?: number | null
          query_reformulation_count?: number | null
          scroll_depth_max?: number | null
          session_duration_ms?: number | null
          session_end_time?: string | null
          session_start_time?: string | null
          total_clicked_results_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_sessions_participant_fk"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "search_sessions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      session_timing: {
        Row: {
          id: string
          participant_id: string
          record_created_at: string
          session_duration_ms: number | null
          session_end_time: string | null
          session_start_time: string
        }
        Insert: {
          id?: string
          participant_id: string
          record_created_at?: string
          session_duration_ms?: number | null
          session_end_time?: string | null
          session_start_time?: string
        }
        Update: {
          id?: string
          participant_id?: string
          record_created_at?: string
          session_duration_ms?: number | null
          session_end_time?: string | null
          session_start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_timing_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      task_instruction: {
        Row: {
          device_type: string | null
          id: string
          ip_address: string | null
          participant_id: string
          q11_response: string | null
          timestamp: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id: string
          q11_response?: string | null
          timestamp?: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_address?: string | null
          participant_id?: string
          q11_response?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instruction_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bucket_task_duration: {
        Args: { duration_seconds: number }
        Returns: string
      }
      compute_query_complexity: {
        Args: { query_text: string }
        Returns: number
      }
      compute_query_complexity_score: {
        Args: { query_text: string }
        Returns: number
      }
      compute_query_structure_type: {
        Args: { query_text: string }
        Returns: string
      }
      create_enhanced_session: {
        Args:
          | {
              p_browser?: string
              p_device_type?: string
              p_location?: string
              p_platform?: string
              p_user_id: string
            }
          | {
              p_screen_resolution?: string
              p_timezone?: string
              p_user_agent?: string
            }
        Returns: string
      }
      detect_query_structure: {
        Args: { query_text: string }
        Returns: string
      }
      log_enhanced_interaction: {
        Args: {
          p_clicked_rank?: number
          p_clicked_url?: string
          p_follow_up_prompt?: string
          p_interaction_type: string
          p_page_scroll_y?: number
          p_query_id: string
          p_scroll_position?: number
          p_viewport_height?: number
        }
        Returns: string
      }
      log_enhanced_query: {
        Args:
          | {
              p_complexity?: number
              p_previous_query_id?: string
              p_query_order: number
              p_query_text: string
              p_session_id: string
              p_structure_type?: string
            }
          | {
              p_query_text: string
              p_results_count?: number
              p_results_loaded_count?: number
              p_session_id: string
            }
        Returns: string
      }
      metric_click_grace_ms: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      metric_idle_timeout_ms: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      populate_all_analytics_tables: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      refresh_all_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_query_metrics: {
        Args: { p_query_id: string }
        Returns: undefined
      }
      validate_data_population: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_session_access: {
        Args: { session_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      interaction_kind:
        | "submit_query"
        | "results_rendered"
        | "result_click"
        | "manual_url"
        | "scroll"
        | "hover"
        | "follow_up_prompt"
        | "finish_task"
      interaction_type:
        | "click"
        | "scroll"
        | "hover"
        | "focus"
        | "keypress"
        | "page_view"
        | "result_click"
        | "manual_url"
        | "results_rendered"
        | "follow_up_prompt"
        | "finish_task"
        | "submit_query"
        | "navigation"
        | "form_interaction"
        | "other"
      search_phase:
        | "pre_search"
        | "search_active"
        | "results_viewing"
        | "post_search"
      tool_type: "google_links" | "chatgpt_chat"
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
      interaction_kind: [
        "submit_query",
        "results_rendered",
        "result_click",
        "manual_url",
        "scroll",
        "hover",
        "follow_up_prompt",
        "finish_task",
      ],
      interaction_type: [
        "click",
        "scroll",
        "hover",
        "focus",
        "keypress",
        "page_view",
        "result_click",
        "manual_url",
        "results_rendered",
        "follow_up_prompt",
        "finish_task",
        "submit_query",
        "navigation",
        "form_interaction",
        "other",
      ],
      search_phase: [
        "pre_search",
        "search_active",
        "results_viewing",
        "post_search",
      ],
      tool_type: ["google_links", "chatgpt_chat"],
    },
  },
} as const
