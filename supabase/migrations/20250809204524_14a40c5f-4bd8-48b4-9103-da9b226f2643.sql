-- Fix Security Definer views by recreating them as regular views
-- First drop all views, then recreate in dependency order

-- Drop all views first
DROP VIEW IF EXISTS public.v_enhanced_query_metrics;
DROP VIEW IF EXISTS public.v_enhanced_session_metrics;
DROP VIEW IF EXISTS public.v_first_click;
DROP VIEW IF EXISTS public.v_first_interaction;
DROP VIEW IF EXISTS public.v_query_end;
DROP VIEW IF EXISTS public.v_results_rendered;

-- Create base views first (no dependencies)
CREATE VIEW public.v_results_rendered AS
SELECT 
    query_id,
    first_result_load_time,
    results_loaded_count,
    EXTRACT(EPOCH FROM (first_result_load_time - query_start_time)) * 1000 as time_to_first_result_ms
FROM public.experiment_queries
WHERE first_result_load_time IS NOT NULL;

CREATE VIEW public.v_first_click AS
SELECT 
    query_id,
    id as first_click_id,
    interaction_time as first_click_time,
    clicked_rank as first_clicked_rank,
    clicked_url as first_clicked_url,
    EXTRACT(EPOCH FROM (interaction_time - (
        SELECT query_start_time FROM public.experiment_queries WHERE id = i.query_id
    ))) * 1000 as time_to_first_click_ms
FROM public.interactions i
WHERE i.id = (
    SELECT id FROM public.interactions i2 
    WHERE i2.query_id = i.query_id 
    AND i2.interaction_type = 'click'
    ORDER BY i2.interaction_time ASC 
    LIMIT 1
);

CREATE VIEW public.v_first_interaction AS
SELECT 
    query_id,
    id as first_interaction_id,
    interaction_time as first_interaction_time,
    interaction_type as first_interaction_type,
    EXTRACT(EPOCH FROM (interaction_time - (
        SELECT query_start_time FROM public.experiment_queries WHERE id = i.query_id
    ))) * 1000 as time_to_first_interaction_ms
FROM public.interactions i
WHERE i.id = (
    SELECT id FROM public.interactions i2 
    WHERE i2.query_id = i.query_id 
    ORDER BY i2.interaction_time ASC 
    LIMIT 1
);

CREATE VIEW public.v_query_end AS
SELECT 
    eq.id as query_id,
    COALESCE(eq.last_interaction_time, eq.created_at) as query_end_time,
    EXTRACT(EPOCH FROM (COALESCE(eq.last_interaction_time, eq.created_at) - eq.query_start_time)) * 1000 as total_query_duration_ms,
    COUNT(i.id) as total_interactions
FROM public.experiment_queries eq
LEFT JOIN public.interactions i ON eq.id = i.query_id
GROUP BY eq.id, eq.last_interaction_time, eq.created_at, eq.query_start_time;

-- Create dependent views after base views exist
CREATE VIEW public.v_enhanced_query_metrics AS
SELECT 
    eq.id,
    eq.session_id,
    eq.query_text,
    eq.results_count,
    eq.results_loaded_count,
    eq.query_start_time,
    EXTRACT(EPOCH FROM (COALESCE(eq.last_interaction_time, eq.created_at) - eq.query_start_time)) * 1000 as total_query_duration_ms,
    rr.time_to_first_result_ms,
    fc.first_clicked_rank,
    fc.time_to_first_click_ms,
    qe.total_interactions,
    COALESCE(qtm.user_clicked, false) as user_clicked,
    COALESCE(qtm.user_scrolled, false) as user_scrolled,
    COALESCE(qtm.query_abandoned, false) as query_abandoned
FROM public.experiment_queries eq
LEFT JOIN public.v_results_rendered rr ON eq.id = rr.query_id
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
    EXTRACT(EPOCH FROM (NOW() - s.start_time)) * 1000 as total_session_duration_ms,
    COALESCE(eq_stats.query_count, 0) as query_count,
    COALESCE(interaction_stats.interaction_count, 0) as interaction_count,
    COALESCE(sts.total_searches, 0) as total_searches,
    COALESCE(sts.successful_queries, 0) as successful_queries,
    COALESCE(sts.total_clicks, 0) as total_clicks,
    COALESCE(sts.avg_time_per_query, 0) as avg_time_per_query,
    COALESCE(sts.avg_time_to_click, 0) as avg_time_to_click,
    COALESCE(sts.clicks_per_query, 0) as clicks_per_query,
    COALESCE(sts.queries_per_minute, 0) as queries_per_minute
FROM public.sessions s
LEFT JOIN (
    SELECT session_id, COUNT(*) as query_count
    FROM public.experiment_queries
    GROUP BY session_id
) eq_stats ON s.id = eq_stats.session_id
LEFT JOIN (
    SELECT s.id as session_id, COUNT(i.*) as interaction_count
    FROM public.sessions s
    LEFT JOIN public.experiment_queries eq ON s.id = eq.session_id
    LEFT JOIN public.interactions i ON eq.id = i.query_id
    GROUP BY s.id
) interaction_stats ON s.id = interaction_stats.session_id
LEFT JOIN public.session_timing_summary sts ON s.id = sts.session_id;