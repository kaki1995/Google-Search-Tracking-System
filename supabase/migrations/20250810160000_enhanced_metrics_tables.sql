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
    
    -- Session Performance
    session_duration INTEGER DEFAULT 0, -- Total time of session
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_interaction_details_metrics_interaction ON public.interaction_details_metrics(interaction_id);
CREATE INDEX IF NOT EXISTS idx_interaction_details_metrics_action ON public.interaction_details_metrics(action_type);
CREATE INDEX IF NOT EXISTS idx_interaction_details_metrics_timestamp ON public.interaction_details_metrics(timestamp_action);

CREATE INDEX IF NOT EXISTS idx_enhanced_interactions_metrics_query ON public.enhanced_interactions_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_interactions_metrics_session ON public.enhanced_interactions_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_interactions_metrics_timing ON public.enhanced_interactions_metrics(time_to_first_click);

CREATE INDEX IF NOT EXISTS idx_experiment_queries_metrics_query ON public.experiment_queries_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_experiment_queries_metrics_session ON public.experiment_queries_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_experiment_queries_metrics_end_time ON public.experiment_queries_metrics(query_end_time);

CREATE INDEX IF NOT EXISTS idx_session_timing_summary_metrics_session ON public.session_timing_summary_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_table_metrics_session ON public.sessions_table_metrics(session_id);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.interaction_details_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_interactions_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_queries_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timing_summary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_table_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. CREATE RLS POLICIES (Allow all access for research)
-- ============================================================================
CREATE POLICY "Allow all access to interaction_details_metrics" ON public.interaction_details_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to enhanced_interactions_metrics" ON public.enhanced_interactions_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to experiment_queries_metrics" ON public.experiment_queries_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to session_timing_summary_metrics" ON public.session_timing_summary_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to sessions_table_metrics" ON public.sessions_table_metrics FOR ALL USING (true);

-- ============================================================================
-- 9. ADD TO REALTIME PUBLICATION
-- ============================================================================
ALTER TABLE public.interaction_details_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.enhanced_interactions_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.experiment_queries_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.session_timing_summary_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.sessions_table_metrics REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_details_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enhanced_interactions_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.experiment_queries_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_timing_summary_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions_table_metrics;
