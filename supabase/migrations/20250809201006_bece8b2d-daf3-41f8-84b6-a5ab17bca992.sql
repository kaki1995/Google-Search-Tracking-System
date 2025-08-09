-- Fix Security Definer Views by converting them to regular views
-- These views don't need elevated privileges for analytics

-- Drop existing Security Definer views
DROP VIEW IF EXISTS public.v_enhanced_query_metrics CASCADE;
DROP VIEW IF EXISTS public.v_enhanced_session_metrics CASCADE;
DROP VIEW IF EXISTS public.v_first_click CASCADE;
DROP VIEW IF EXISTS public.v_first_interaction CASCADE;
DROP VIEW IF EXISTS public.v_query_end CASCADE;
DROP VIEW IF EXISTS public.v_results_rendered CASCADE;

-- Recreate views without Security Definer
CREATE VIEW public.v_first_click AS
SELECT DISTINCT ON (i.query_id)
    i.query_id,
    i.id as first_click_id,
    i.clicked_rank as first_clicked_rank,
    i.clicked_url as first_clicked_url,
    i.interaction_time as first_click_time,
    EXTRACT(EPOCH FROM (i.interaction_time - eq.query_start_time)) * 1000 as time_to_first_click_ms
FROM public.interactions i
JOIN public.experiment_queries eq ON i.query_id = eq.id
WHERE i.interaction_type = 'click'
ORDER BY i.query_id, i.interaction_time;

CREATE VIEW public.v_first_interaction AS
SELECT DISTINCT ON (i.query_id)
    i.query_id,
    i.id as first_interaction_id,
    i.interaction_time as first_interaction_time,
    i.interaction_type as first_interaction_type,
    EXTRACT(EPOCH FROM (i.interaction_time - eq.query_start_time)) * 1000 as time_to_first_interaction_ms
FROM public.interactions i
JOIN public.experiment_queries eq ON i.query_id = eq.id
ORDER BY i.query_id, i.interaction_time;

CREATE VIEW public.v_query_end AS
SELECT 
    eq.id as query_id,
    COALESCE(MAX(i.interaction_time), eq.query_start_time) as query_end_time,
    COUNT(i.id) as total_interactions,
    EXTRACT(EPOCH FROM (COALESCE(MAX(i.interaction_time), eq.query_start_time) - eq.query_start_time)) * 1000 as total_query_duration_ms
FROM public.experiment_queries eq
LEFT JOIN public.interactions i ON eq.id = i.query_id
GROUP BY eq.id, eq.query_start_time;

CREATE VIEW public.v_results_rendered AS
SELECT 
    eq.id as query_id,
    eq.first_result_load_time,
    EXTRACT(EPOCH FROM (eq.first_result_load_time - eq.query_start_time)) * 1000 as time_to_first_result_ms,
    eq.results_loaded_count
FROM public.experiment_queries eq
WHERE eq.first_result_load_time IS NOT NULL;

CREATE VIEW public.v_enhanced_query_metrics AS
SELECT 
    eq.id,
    eq.session_id,
    eq.query_text,
    eq.results_count,
    eq.results_loaded_count,
    eq.query_start_time,
    vr.time_to_first_result_ms,
    fc.time_to_first_click_ms,
    fc.first_clicked_rank,
    qe.total_query_duration_ms,
    qe.total_interactions,
    qtm.user_clicked,
    qtm.user_scrolled,
    qtm.query_abandoned
FROM public.experiment_queries eq
LEFT JOIN public.v_results_rendered vr ON eq.id = vr.query_id
LEFT JOIN public.v_first_click fc ON eq.id = fc.query_id
LEFT JOIN public.v_query_end qe ON eq.id = qe.query_id
LEFT JOIN public.query_timing_metrics qtm ON eq.id = qtm.query_id;

CREATE VIEW public.v_enhanced_session_metrics AS
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
    COUNT(DISTINCT eq.id) as query_count,
    COUNT(DISTINCT i.id) as interaction_count
FROM public.sessions s
LEFT JOIN public.session_timing_summary sts ON s.id = sts.session_id
LEFT JOIN public.experiment_queries eq ON s.id = eq.session_id
LEFT JOIN public.interactions i ON eq.id = i.query_id
GROUP BY s.id, s.start_time, s.search_phase, s.user_agent, s.screen_resolution,
         sts.total_session_duration_ms, sts.total_searches, sts.successful_queries,
         sts.avg_time_per_query, sts.total_clicks, sts.avg_time_to_click,
         sts.clicks_per_query, sts.queries_per_minute;

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.create_enhanced_session(
    p_user_agent text DEFAULT NULL::text, 
    p_screen_resolution text DEFAULT NULL::text, 
    p_timezone text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    p_session_id uuid, 
    p_query_text text, 
    p_results_count integer DEFAULT 0, 
    p_results_loaded_count integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    p_query_id uuid, 
    p_interaction_type interaction_type, 
    p_clicked_url text DEFAULT NULL::text, 
    p_clicked_rank integer DEFAULT NULL::integer, 
    p_element_id text DEFAULT NULL::text, 
    p_element_text text DEFAULT NULL::text, 
    p_session_time_ms bigint DEFAULT NULL::bigint, 
    p_query_time_ms bigint DEFAULT NULL::bigint
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
        interaction_time
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