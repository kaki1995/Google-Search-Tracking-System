-- ============================================================================
-- MANUAL ENHANCED METRICS MIGRATION SCRIPT
-- Run this script in your Supabase SQL Editor to create all enhanced metrics tables
-- ============================================================================

-- Create comprehensive metrics tables based on provided specifications
-- Run this migration to add the missing enhanced metrics tables

-- ============================================================================
-- 1. INTERACTION DETAILS METRICS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interaction_details_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
    
    -- Core Action Type
    action_type TEXT NOT NULL, -- 'click', 'hover', 'scroll', 'focus', etc.
    
    -- Context Data 
    additional_data JSONB DEFAULT '{}', -- Extra context: title, URL, element details
    page_scroll_y INTEGER DEFAULT 0, -- Vertical scroll position when action occurred
    timestamp_action TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. ENHANCED INTERACTIONS METRICS TABLE 
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enhanced_interactions_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Position & Ranking
    result_position INTEGER, -- Rank of result clicked (1, 2, 3, etc.)
    scroll_position INTEGER DEFAULT 0, -- How far user scrolled
    
    -- Timing Metrics
    time_to_first_click INTEGER, -- Time from session start to first click
    time_to_first_interaction INTEGER, -- Time to first click/scroll after query 
    time_to_first_result INTEGER, -- Simulated/real result load time
    
    -- Behavior Flags
    user_clicked BOOLEAN DEFAULT false, -- Did the user click a result
    user_scrolled BOOLEAN DEFAULT false, -- Did the user scroll
    
    -- Viewport Context
    viewport_height INTEGER DEFAULT 0, -- Visible screen height
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. EXPERIMENT QUERIES METRICS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.experiment_queries_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Query End Tracking
    query_end_time TIMESTAMP WITH TIME ZONE, -- When interaction ended
    result_rank INTEGER, -- Position of result clicked
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. SESSION TIMING SUMMARY METRICS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.session_timing_summary_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Query Performance
    avg_time_per_query REAL DEFAULT 0, -- Mean query time
    avg_time_to_click REAL DEFAULT 0, -- Average click delay
    clicks_per_query REAL DEFAULT 0, -- Click rate
    
    -- Session Bounds
    max_time_per_query INTEGER DEFAULT 0, -- Longest query time
    min_time_per_query INTEGER DEFAULT 0, -- Fastest query time
    queries_per_minute REAL DEFAULT 0, -- Query rate
    
    -- Interaction Counts
    successful_queries INTEGER DEFAULT 0, -- Queries with at least one click
    total_clicks INTEGER DEFAULT 0, -- All result clicks
    total_queries_executed INTEGER DEFAULT 0, -- Query count
    total_scroll_events INTEGER DEFAULT 0, -- Scroll actions
    total_session_duration INTEGER DEFAULT 0, -- Full duration in ms
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. SESSIONS TABLE METRICS (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sessions_table_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Session Duration Enhancement
    session_duration INTEGER DEFAULT 0, -- Total session time in milliseconds
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Interaction Details Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_interaction_details_metrics_interaction_id 
ON public.interaction_details_metrics(interaction_id);

CREATE INDEX IF NOT EXISTS idx_interaction_details_metrics_action_type 
ON public.interaction_details_metrics(action_type);

CREATE INDEX IF NOT EXISTS idx_interaction_details_metrics_timestamp 
ON public.interaction_details_metrics(timestamp_action);

-- Enhanced Interactions Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_interactions_metrics_query_id 
ON public.enhanced_interactions_metrics(query_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_interactions_metrics_session_id 
ON public.enhanced_interactions_metrics(session_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_interactions_metrics_result_position 
ON public.enhanced_interactions_metrics(result_position);

-- Experiment Queries Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_experiment_queries_metrics_query_id 
ON public.experiment_queries_metrics(query_id);

CREATE INDEX IF NOT EXISTS idx_experiment_queries_metrics_session_id 
ON public.experiment_queries_metrics(session_id);

-- Session Timing Summary Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_session_timing_summary_metrics_session_id 
ON public.session_timing_summary_metrics(session_id);

-- Sessions Table Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_table_metrics_session_id 
ON public.sessions_table_metrics(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new metrics tables
ALTER TABLE public.interaction_details_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_interactions_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_queries_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timing_summary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_table_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for each table (allow all operations for authenticated users)
-- Interaction Details Metrics Policies
DROP POLICY IF EXISTS "interaction_details_metrics_policy" ON public.interaction_details_metrics;
CREATE POLICY "interaction_details_metrics_policy" ON public.interaction_details_metrics
FOR ALL USING (true) WITH CHECK (true);

-- Enhanced Interactions Metrics Policies
DROP POLICY IF EXISTS "enhanced_interactions_metrics_policy" ON public.enhanced_interactions_metrics;
CREATE POLICY "enhanced_interactions_metrics_policy" ON public.enhanced_interactions_metrics
FOR ALL USING (true) WITH CHECK (true);

-- Experiment Queries Metrics Policies
DROP POLICY IF EXISTS "experiment_queries_metrics_policy" ON public.experiment_queries_metrics;
CREATE POLICY "experiment_queries_metrics_policy" ON public.experiment_queries_metrics
FOR ALL USING (true) WITH CHECK (true);

-- Session Timing Summary Metrics Policies
DROP POLICY IF EXISTS "session_timing_summary_metrics_policy" ON public.session_timing_summary_metrics;
CREATE POLICY "session_timing_summary_metrics_policy" ON public.session_timing_summary_metrics
FOR ALL USING (true) WITH CHECK (true);

-- Sessions Table Metrics Policies
DROP POLICY IF EXISTS "sessions_table_metrics_policy" ON public.sessions_table_metrics;
CREATE POLICY "sessions_table_metrics_policy" ON public.sessions_table_metrics
FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_details_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enhanced_interactions_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.experiment_queries_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_timing_summary_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions_table_metrics;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created successfully
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%_metrics'
ORDER BY tablename;

-- Verify indexes were created
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%_metrics'
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE '%_metrics'
ORDER BY tablename, policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Metrics Migration completed successfully at %', now();
    RAISE NOTICE '5 new metrics tables created with indexes, RLS policies, and realtime subscriptions';
    RAISE NOTICE 'Tables: interaction_details_metrics, enhanced_interactions_metrics, experiment_queries_metrics, session_timing_summary_metrics, sessions_table_metrics';
END $$;
