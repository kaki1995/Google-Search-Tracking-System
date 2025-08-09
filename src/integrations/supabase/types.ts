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
          {
            foreignKeyName: "background_surveys_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_session_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_queries: {
        Row: {
          complexity: number | null
          created_at: string | null
          first_result_load_time: string | null
          id: string
          last_interaction_time: string | null
          previous_query_id: string | null
          query_metadata: Json | null
          query_order: number | null
          query_start_time: string | null
          query_text: string
          reformulation_count: number | null
          results_count: number | null
          results_loaded_count: number | null
          session_id: string
          structure_type: string | null
          time_per_query: number | null
          timestamp: string | null
          updated_at: string | null
        }
        Insert: {
          complexity?: number | null
          created_at?: string | null
          first_result_load_time?: string | null
          id?: string
          last_interaction_time?: string | null
          previous_query_id?: string | null
          query_metadata?: Json | null
          query_order?: number | null
          query_start_time?: string | null
          query_text: string
          reformulation_count?: number | null
          results_count?: number | null
          results_loaded_count?: number | null
          session_id: string
          structure_type?: string | null
          time_per_query?: number | null
          timestamp?: string | null
          updated_at?: string | null
        }
        Update: {
          complexity?: number | null
          created_at?: string | null
          first_result_load_time?: string | null
          id?: string
          last_interaction_time?: string | null
          previous_query_id?: string | null
          query_metadata?: Json | null
          query_order?: number | null
          query_start_time?: string | null
          query_text?: string
          reformulation_count?: number | null
          results_count?: number | null
          results_loaded_count?: number | null
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
            foreignKeyName: "experiment_queries_previous_query_id_fkey"
            columns: ["previous_query_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_query_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_queries_previous_query_id_fkey"
            columns: ["previous_query_id"]
            isOneToOne: false
            referencedRelation: "v_query_end"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "experiment_queries_previous_query_id_fkey"
            columns: ["previous_query_id"]
            isOneToOne: false
            referencedRelation: "v_results_rendered"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "experiment_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_session_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_details: {
        Row: {
          created_at: string
          element_id: string | null
          id: string
          interaction_id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          metadata: Json | null
          value: string | null
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          id?: string
          interaction_id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          metadata?: Json | null
          value?: string | null
        }
        Update: {
          created_at?: string
          element_id?: string | null
          id?: string
          interaction_id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          metadata?: Json | null
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
          {
            foreignKeyName: "interaction_details_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "v_first_click"
            referencedColumns: ["first_click_id"]
          },
          {
            foreignKeyName: "interaction_details_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "v_first_interaction"
            referencedColumns: ["first_interaction_id"]
          },
        ]
      }
      interactions: {
        Row: {
          clicked_rank: number | null
          clicked_result_count: number | null
          clicked_url: string | null
          created_at: string | null
          element_id: string | null
          element_text: string | null
          element_visibility: boolean | null
          follow_up_prompt: boolean | null
          hover_duration_ms: number | null
          id: string
          interaction_metadata: Json | null
          interaction_time: string | null
          interaction_type:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          page_coordinates: unknown | null
          query_id: string
          query_time_ms: number | null
          scroll_depth: number | null
          session_time_ms: number | null
          updated_at: string | null
          viewport_coordinates: unknown | null
        }
        Insert: {
          clicked_rank?: number | null
          clicked_result_count?: number | null
          clicked_url?: string | null
          created_at?: string | null
          element_id?: string | null
          element_text?: string | null
          element_visibility?: boolean | null
          follow_up_prompt?: boolean | null
          hover_duration_ms?: number | null
          id?: string
          interaction_metadata?: Json | null
          interaction_time?: string | null
          interaction_type?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          page_coordinates?: unknown | null
          query_id: string
          query_time_ms?: number | null
          scroll_depth?: number | null
          session_time_ms?: number | null
          updated_at?: string | null
          viewport_coordinates?: unknown | null
        }
        Update: {
          clicked_rank?: number | null
          clicked_result_count?: number | null
          clicked_url?: string | null
          created_at?: string | null
          element_id?: string | null
          element_text?: string | null
          element_visibility?: boolean | null
          follow_up_prompt?: boolean | null
          hover_duration_ms?: number | null
          id?: string
          interaction_metadata?: Json | null
          interaction_time?: string | null
          interaction_type?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          page_coordinates?: unknown | null
          query_id?: string
          query_time_ms?: number | null
          scroll_depth?: number | null
          session_time_ms?: number | null
          updated_at?: string | null
          viewport_coordinates?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_query_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_query_end"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_results_rendered"
            referencedColumns: ["query_id"]
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
          {
            foreignKeyName: "post_survey_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_session_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      query_timing_metrics: {
        Row: {
          created_at: string
          id: string
          query_abandoned: boolean | null
          query_end_time: string | null
          query_id: string
          results_loaded_count: number | null
          search_duration_ms: number | null
          time_to_first_click_ms: number | null
          time_to_first_result: number | null
          user_clicked: boolean | null
          user_scrolled: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          query_abandoned?: boolean | null
          query_end_time?: string | null
          query_id: string
          results_loaded_count?: number | null
          search_duration_ms?: number | null
          time_to_first_click_ms?: number | null
          time_to_first_result?: number | null
          user_clicked?: boolean | null
          user_scrolled?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          query_abandoned?: boolean | null
          query_end_time?: string | null
          query_id?: string
          results_loaded_count?: number | null
          search_duration_ms?: number | null
          time_to_first_click_ms?: number | null
          time_to_first_result?: number | null
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
          {
            foreignKeyName: "query_timing_metrics_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_query_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_timing_metrics_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_query_end"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "query_timing_metrics_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_results_rendered"
            referencedColumns: ["query_id"]
          },
        ]
      }
      session_timing_summary: {
        Row: {
          avg_time_per_query: number | null
          avg_time_to_click: number | null
          clicks_per_query: number | null
          created_at: string
          id: string
          min_max_time_per_query: string | null
          queries_per_minute: number | null
          session_id: string
          successful_queries: number | null
          total_clicks: number | null
          total_searches: number | null
          total_session_duration_ms: number | null
          updated_at: string
        }
        Insert: {
          avg_time_per_query?: number | null
          avg_time_to_click?: number | null
          clicks_per_query?: number | null
          created_at?: string
          id?: string
          min_max_time_per_query?: string | null
          queries_per_minute?: number | null
          session_id: string
          successful_queries?: number | null
          total_clicks?: number | null
          total_searches?: number | null
          total_session_duration_ms?: number | null
          updated_at?: string
        }
        Update: {
          avg_time_per_query?: number | null
          avg_time_to_click?: number | null
          clicks_per_query?: number | null
          created_at?: string
          id?: string
          min_max_time_per_query?: string | null
          queries_per_minute?: number | null
          session_id?: string
          successful_queries?: number | null
          total_clicks?: number | null
          total_searches?: number | null
          total_session_duration_ms?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_timing_summary_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_timing_summary_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "v_enhanced_session_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          browser: string | null
          budget_range: string | null
          created_at: string | null
          current_query_id: string | null
          device_type: string | null
          id: string
          location: string | null
          platform: string
          screen_resolution: string | null
          search_phase: Database["public"]["Enums"]["search_phase"] | null
          session_duration: number | null
          session_metadata: Json | null
          start_time: string
          time_to_first_query: number | null
          timezone: string | null
          total_queries: number | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          budget_range?: string | null
          created_at?: string | null
          current_query_id?: string | null
          device_type?: string | null
          id?: string
          location?: string | null
          platform: string
          screen_resolution?: string | null
          search_phase?: Database["public"]["Enums"]["search_phase"] | null
          session_duration?: number | null
          session_metadata?: Json | null
          start_time?: string
          time_to_first_query?: number | null
          timezone?: string | null
          total_queries?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          budget_range?: string | null
          created_at?: string | null
          current_query_id?: string | null
          device_type?: string | null
          id?: string
          location?: string | null
          platform?: string
          screen_resolution?: string | null
          search_phase?: Database["public"]["Enums"]["search_phase"] | null
          session_duration?: number | null
          session_metadata?: Json | null
          start_time?: string
          time_to_first_query?: number | null
          timezone?: string | null
          total_queries?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_current_query_id_fkey"
            columns: ["current_query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_current_query_id_fkey"
            columns: ["current_query_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_query_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_current_query_id_fkey"
            columns: ["current_query_id"]
            isOneToOne: false
            referencedRelation: "v_query_end"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "sessions_current_query_id_fkey"
            columns: ["current_query_id"]
            isOneToOne: false
            referencedRelation: "v_results_rendered"
            referencedColumns: ["query_id"]
          },
        ]
      }
    }
    Views: {
      v_enhanced_query_metrics: {
        Row: {
          first_clicked_rank: number | null
          id: string | null
          query_abandoned: boolean | null
          query_start_time: string | null
          query_text: string | null
          results_count: number | null
          results_loaded_count: number | null
          session_id: string | null
          time_to_first_click_ms: number | null
          time_to_first_result_ms: number | null
          total_interactions: number | null
          total_query_duration_ms: number | null
          user_clicked: boolean | null
          user_scrolled: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_session_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      v_enhanced_session_metrics: {
        Row: {
          avg_time_per_query: number | null
          avg_time_to_click: number | null
          clicks_per_query: number | null
          id: string | null
          interaction_count: number | null
          queries_per_minute: number | null
          query_count: number | null
          screen_resolution: string | null
          search_phase: Database["public"]["Enums"]["search_phase"] | null
          start_time: string | null
          successful_queries: number | null
          total_clicks: number | null
          total_searches: number | null
          total_session_duration_ms: number | null
          user_agent: string | null
        }
        Relationships: []
      }
      v_first_click: {
        Row: {
          first_click_id: string | null
          first_click_time: string | null
          first_clicked_rank: number | null
          first_clicked_url: string | null
          query_id: string | null
          time_to_first_click_ms: number | null
        }
        Insert: {
          first_click_id?: string | null
          first_click_time?: string | null
          first_clicked_rank?: number | null
          first_clicked_url?: string | null
          query_id?: string | null
          time_to_first_click_ms?: never
        }
        Update: {
          first_click_id?: string | null
          first_click_time?: string | null
          first_clicked_rank?: number | null
          first_clicked_url?: string | null
          query_id?: string | null
          time_to_first_click_ms?: never
        }
        Relationships: [
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_query_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_query_end"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_results_rendered"
            referencedColumns: ["query_id"]
          },
        ]
      }
      v_first_interaction: {
        Row: {
          first_interaction_id: string | null
          first_interaction_time: string | null
          first_interaction_type:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          query_id: string | null
          time_to_first_interaction_ms: number | null
        }
        Insert: {
          first_interaction_id?: string | null
          first_interaction_time?: string | null
          first_interaction_type?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          query_id?: string | null
          time_to_first_interaction_ms?: never
        }
        Update: {
          first_interaction_id?: string | null
          first_interaction_time?: string | null
          first_interaction_type?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          query_id?: string | null
          time_to_first_interaction_ms?: never
        }
        Relationships: [
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "experiment_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_enhanced_query_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_query_end"
            referencedColumns: ["query_id"]
          },
          {
            foreignKeyName: "interactions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "v_results_rendered"
            referencedColumns: ["query_id"]
          },
        ]
      }
      v_query_end: {
        Row: {
          query_end_time: string | null
          query_id: string | null
          total_interactions: number | null
          total_query_duration_ms: number | null
        }
        Relationships: []
      }
      v_results_rendered: {
        Row: {
          first_result_load_time: string | null
          query_id: string | null
          results_loaded_count: number | null
          time_to_first_result_ms: number | null
        }
        Insert: {
          first_result_load_time?: string | null
          query_id?: string | null
          results_loaded_count?: number | null
          time_to_first_result_ms?: never
        }
        Update: {
          first_result_load_time?: string | null
          query_id?: string | null
          results_loaded_count?: number | null
          time_to_first_result_ms?: never
        }
        Relationships: []
      }
    }
    Functions: {
      create_enhanced_session: {
        Args: {
          p_user_agent?: string
          p_screen_resolution?: string
          p_timezone?: string
        }
        Returns: string
      }
      log_enhanced_interaction: {
        Args: {
          p_query_id: string
          p_interaction_type: Database["public"]["Enums"]["interaction_type"]
          p_clicked_url?: string
          p_clicked_rank?: number
          p_element_id?: string
          p_element_text?: string
          p_session_time_ms?: number
          p_query_time_ms?: number
        }
        Returns: string
      }
      log_enhanced_query: {
        Args: {
          p_session_id: string
          p_query_text: string
          p_results_count?: number
          p_results_loaded_count?: number
        }
        Returns: string
      }
      validate_session_access: {
        Args: { session_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      interaction_type:
        | "click"
        | "scroll"
        | "hover"
        | "focus"
        | "keypress"
        | "page_view"
      search_phase:
        | "pre_search"
        | "search_active"
        | "results_viewing"
        | "post_search"
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
      interaction_type: [
        "click",
        "scroll",
        "hover",
        "focus",
        "keypress",
        "page_view",
      ],
      search_phase: [
        "pre_search",
        "search_active",
        "results_viewing",
        "post_search",
      ],
    },
  },
} as const
