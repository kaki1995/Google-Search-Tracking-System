-- Enhanced SERP Experiment Tracking Schema
-- Migration: 20250809184400_52a0df7f-35ea-4bfd-96e0-0e3becf06875

-- Create enums for interaction types and search phases
CREATE TYPE interaction_type AS ENUM ('click', 'scroll', 'hover', 'focus', 'keypress', 'page_view');
CREATE TYPE search_phase AS ENUM ('pre_search', 'search_active', 'results_viewing', 'post_search');

-- Add new columns to existing sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS search_phase search_phase DEFAULT 'pre_search',
ADD COLUMN IF NOT EXISTS current_query_id UUID REFERENCES public.experiment_queries(id),
ADD COLUMN IF NOT EXISTS session_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add new columns to existing experiment_queries table  
ALTER TABLE public.experiment_queries
ADD COLUMN IF NOT EXISTS query_start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS query_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS results_loaded_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_result_load_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_interaction_time TIMESTAMP WITH TIME ZONE;

-- Add new columns to existing interactions table
ALTER TABLE public.interactions
ADD COLUMN IF NOT EXISTS interaction_type interaction_type DEFAULT 'click',
ADD COLUMN IF NOT EXISTS element_id TEXT,
ADD COLUMN IF NOT EXISTS element_text TEXT,
ADD COLUMN IF NOT EXISTS page_coordinates POINT,
ADD COLUMN IF NOT EXISTS viewport_coordinates POINT,
ADD COLUMN IF NOT EXISTS interaction_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS session_time_ms BIGINT,
ADD COLUMN IF NOT EXISTS query_time_ms BIGINT;

-- Create query_timing_metrics table
CREATE TABLE IF NOT EXISTS public.query_timing_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id UUID NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
    search_duration_ms INTEGER,
    time_to_first_result INTEGER,
    time_to_first_click_ms INTEGER,
    results_loaded_count INTEGER DEFAULT 0,
    user_clicked BOOLEAN DEFAULT false,
    user_scrolled BOOLEAN DEFAULT false,
    query_abandoned BOOLEAN DEFAULT false,
    query_end_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interaction_details table
CREATE TABLE IF NOT EXISTS public.interaction_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    element_id TEXT,
    value TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_timing_summary table
CREATE TABLE IF NOT EXISTS public.session_timing_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
    total_session_duration_ms BIGINT,
    total_searches INTEGER DEFAULT 0,
    successful_queries INTEGER DEFAULT 0,
    avg_time_per_query REAL,
    min_max_time_per_query TEXT,
    total_clicks INTEGER DEFAULT 0,
    avg_time_to_click REAL,
    clicks_per_query REAL,
    queries_per_minute REAL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_search_phase ON public.sessions(search_phase);
CREATE INDEX IF NOT EXISTS idx_sessions_current_query ON public.sessions(current_query_id);
CREATE INDEX IF NOT EXISTS idx_queries_start_time ON public.experiment_queries(query_start_time);
CREATE INDEX IF NOT EXISTS idx_queries_session_start ON public.experiment_queries(session_id, query_start_time);
CREATE INDEX IF NOT EXISTS idx_interactions_type_time ON public.interactions(interaction_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_interactions_session_time ON public.interactions(query_id, session_time_ms);
CREATE INDEX IF NOT EXISTS idx_query_timing_metrics_query ON public.query_timing_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_query_timing_metrics_end_time ON public.query_timing_metrics(query_end_time);
CREATE INDEX IF NOT EXISTS idx_interaction_details_interaction ON public.interaction_details(interaction_id);
CREATE INDEX IF NOT EXISTS idx_interaction_details_type ON public.interaction_details(interaction_type);
CREATE INDEX IF NOT EXISTS idx_session_timing_summary_session ON public.session_timing_summary(session_id);

-- Create computed views for analytics
CREATE OR REPLACE VIEW public.v_first_interaction AS
SELECT DISTINCT ON (i.query_id) 
    i.query_id,
    i.id as first_interaction_id,
    i.timestamp as first_interaction_time,
    i.interaction_type as first_interaction_type,
    EXTRACT(EPOCH FROM (i.timestamp - eq.query_start_time)) * 1000 as time_to_first_interaction_ms
FROM public.interactions i
JOIN public.experiment_queries eq ON i.query_id = eq.id
WHERE i.interaction_type = 'click'
ORDER BY i.query_id, i.timestamp ASC;

CREATE OR REPLACE VIEW public.v_first_click AS  
SELECT DISTINCT ON (i.query_id)
    i.query_id,
    i.id as first_click_id,
    i.timestamp as first_click_time,
    i.clicked_url as first_clicked_url,
    i.clicked_rank as first_clicked_rank,
    EXTRACT(EPOCH FROM (i.timestamp - eq.query_start_time)) * 1000 as time_to_first_click_ms
FROM public.interactions i
JOIN public.experiment_queries eq ON i.query_id = eq.id  
WHERE i.interaction_type = 'click'
ORDER BY i.query_id, i.timestamp ASC;

CREATE OR REPLACE VIEW public.v_results_rendered AS
SELECT 
    eq.id as query_id,
    eq.results_loaded_count,
    eq.first_result_load_time,
    EXTRACT(EPOCH FROM (eq.first_result_load_time - eq.query_start_time)) * 1000 as time_to_first_result_ms
FROM public.experiment_queries eq
WHERE eq.first_result_load_time IS NOT NULL;

CREATE OR REPLACE VIEW public.v_query_end AS
SELECT 
    eq.id as query_id,
    eq.last_interaction_time as query_end_time,
    EXTRACT(EPOCH FROM (eq.last_interaction_time - eq.query_start_time)) * 1000 as total_query_duration_ms,
    (SELECT COUNT(*) FROM public.interactions WHERE query_id = eq.id) as total_interactions
FROM public.experiment_queries eq
WHERE eq.last_interaction_time IS NOT NULL;

CREATE OR REPLACE VIEW public.v_enhanced_query_metrics AS
SELECT 
    eq.id,
    eq.session_id,
    eq.query_text,
    eq.query_start_time,
    eq.results_count,
    eq.results_loaded_count,
    vr.time_to_first_result_ms,
    vfc.time_to_first_click_ms,
    vfc.first_clicked_rank,
    vqe.total_query_duration_ms,
    vqe.total_interactions,
    qtm.user_clicked,
    qtm.user_scrolled,
    qtm.query_abandoned
FROM public.experiment_queries eq
LEFT JOIN public.v_results_rendered vr ON eq.id = vr.query_id
LEFT JOIN public.v_first_click vfc ON eq.id = vfc.query_id  
LEFT JOIN public.v_query_end vqe ON eq.id = vqe.query_id
LEFT JOIN public.query_timing_metrics qtm ON eq.id = qtm.query_id;

CREATE OR REPLACE VIEW public.v_enhanced_session_metrics AS
SELECT 
    s.id,
    s.start_time,
    s.search_phase,
    s.user_agent,
    s.screen_resolution,
    sts.total_session_duration_ms,
    sts.total_searches,
    sts.successful_queries, 
    sts.avg_time_per_query,
    sts.total_clicks,
    sts.avg_time_to_click,
    sts.clicks_per_query,
    sts.queries_per_minute,
    (SELECT COUNT(*) FROM public.experiment_queries WHERE session_id = s.id) as query_count,
    (SELECT COUNT(*) FROM public.interactions i JOIN public.experiment_queries eq ON i.query_id = eq.id WHERE eq.session_id = s.id) as interaction_count
FROM public.sessions s
LEFT JOIN public.session_timing_summary sts ON s.id = sts.session_id;

-- Enable RLS on new tables
ALTER TABLE public.query_timing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_details ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.session_timing_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables (allowing all access for research purposes)
CREATE POLICY "Allow all access to query_timing_metrics" ON public.query_timing_metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to interaction_details" ON public.interaction_details FOR ALL USING (true);
CREATE POLICY "Allow all access to session_timing_summary" ON public.session_timing_summary FOR ALL USING (true);

-- Create RPC helper functions for enhanced tracking
CREATE OR REPLACE FUNCTION public.create_enhanced_session(
    p_user_agent TEXT DEFAULT NULL,
    p_screen_resolution TEXT DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_session_id UUID;
BEGIN
    INSERT INTO public.sessions (
        user_agent,
        screen_resolution, 
        timezone,
        session_metadata
    ) VALUES (
        p_user_agent,
        p_screen_resolution,
        p_timezone,
        jsonb_build_object(
            'enhanced_tracking', true,
            'created_at', now()
        )
    ) RETURNING id INTO new_session_id;
    
    RETURN new_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_enhanced_query(
    p_session_id UUID,
    p_query_text TEXT,
    p_results_count INTEGER DEFAULT 0,
    p_results_loaded_count INTEGER DEFAULT 0
) RETURNS UUID  
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_query_id UUID;
BEGIN
    INSERT INTO public.experiment_queries (
        session_id,
        query_text,
        results_count,
        results_loaded_count,
        query_start_time,
        first_result_load_time
    ) VALUES (
        p_session_id,
        p_query_text,
        p_results_count,
        p_results_loaded_count,
        now(),
        CASE WHEN p_results_loaded_count > 0 THEN now() ELSE NULL END
    ) RETURNING id INTO new_query_id;
    
    -- Update session current query
    UPDATE public.sessions 
    SET current_query_id = new_query_id,
        search_phase = 'search_active'
    WHERE id = p_session_id;
    
    RETURN new_query_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_enhanced_interaction(
    p_query_id UUID,
    p_interaction_type interaction_type,
    p_clicked_url TEXT DEFAULT NULL,
    p_clicked_rank INTEGER DEFAULT NULL,
    p_element_id TEXT DEFAULT NULL,
    p_element_text TEXT DEFAULT NULL,
    p_session_time_ms BIGINT DEFAULT NULL,
    p_query_time_ms BIGINT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql  
SECURITY DEFINER
AS $$
DECLARE
    new_interaction_id UUID;
BEGIN
    INSERT INTO public.interactions (
        query_id,
        interaction_type,
        clicked_url,
        clicked_rank,
        element_id,
        element_text,
        session_time_ms,
        query_time_ms,
        timestamp
    ) VALUES (
        p_query_id,
        p_interaction_type,
        p_clicked_url,
        p_clicked_rank,
        p_element_id,
        p_element_text,
        p_session_time_ms,
        p_query_time_ms,
        now()
    ) RETURNING id INTO new_interaction_id;
    
    -- Update query last interaction time
    UPDATE public.experiment_queries
    SET last_interaction_time = now()
    WHERE id = p_query_id;
    
    RETURN new_interaction_id;
END;
$$;