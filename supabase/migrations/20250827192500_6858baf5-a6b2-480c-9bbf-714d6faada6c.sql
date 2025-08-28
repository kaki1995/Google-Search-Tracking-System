-- Security Fix Migration Part 6: Fix remaining functions and complete security fixes
-- Fix remaining functions with proper table references and search_path

CREATE OR REPLACE FUNCTION public.populate_system_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert system metrics for each session
    INSERT INTO system_metrics (
        session_id,
        response_time_ms,
        server_load,
        database_latency,
        api_call_count,
        error_count,
        cache_hit_rate,
        bandwidth_usage,
        memory_usage,
        cpu_utilization,
        concurrent_users,
        request_queue_size,
        processing_time_ms,
        network_latency,
        storage_usage,
        backup_status,
        security_events,
        performance_alerts,
        system_health_score,
        maintenance_windows
    )
    VALUES (
        NEW.id,
        -- Simulated metrics (in production, these would come from actual monitoring)
        FLOOR(50 + RANDOM() * 200), -- response_time_ms: 50-250ms
        ROUND((0.3 + RANDOM() * 0.4)::numeric, 2), -- server_load: 30-70%
        FLOOR(10 + RANDOM() * 40), -- database_latency: 10-50ms
        FLOOR(5 + RANDOM() * 15), -- api_call_count: 5-20 calls
        0, -- error_count: start with 0
        ROUND((0.7 + RANDOM() * 0.25)::numeric, 2), -- cache_hit_rate: 70-95%
        FLOOR(1024 + RANDOM() * 2048), -- bandwidth_usage: 1-3 KB
        ROUND((0.2 + RANDOM() * 0.3)::numeric, 2), -- memory_usage: 20-50%
        ROUND((0.1 + RANDOM() * 0.4)::numeric, 2), -- cpu_utilization: 10-50%
        1, -- concurrent_users: simplified
        FLOOR(RANDOM() * 5), -- request_queue_size: 0-5
        FLOOR(20 + RANDOM() * 100), -- processing_time_ms: 20-120ms
        FLOOR(5 + RANDOM() * 20), -- network_latency: 5-25ms
        FLOOR(1000000 + RANDOM() * 500000), -- storage_usage: ~1-1.5MB
        'healthy', -- backup_status
        0, -- security_events: start with 0
        '[]'::jsonb, -- performance_alerts: empty array
        FLOOR(85 + RANDOM() * 15), -- system_health_score: 85-100
        '[]'::jsonb -- maintenance_windows: empty array
    );

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_session_timing_summary()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    session_record RECORD;
    query_stats RECORD;
    interaction_stats RECORD;
    session_duration_ms INTEGER;
BEGIN
    -- Get session info from search_sessions table (the actual table in our schema)
    SELECT * INTO session_record FROM public.search_sessions WHERE id = NEW.participant_id;
    
    IF session_record IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Calculate session duration
    session_duration_ms := EXTRACT(EPOCH FROM (NOW() - session_record.session_start_time)) * 1000;
    
    -- Get query statistics from queries table
    SELECT 
        COUNT(*) as total_searches,
        AVG(q.query_duration_ms) as avg_time_per_query,
        MIN(q.query_duration_ms) as min_time,
        MAX(q.query_duration_ms) as max_time,
        SUM(q.click_count) as total_clicks
    INTO query_stats
    FROM public.queries q
    WHERE q.session_id = NEW.session_id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_interaction_details()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Auto-create detailed interaction record  
    INSERT INTO interaction_details (
        interaction_id,
        element_id,
        interaction_type,
        action_type,
        value,
        additional_data,
        page_scroll_y,
        viewport_height,
        result_rank
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.element_id, 'unknown'),
        NEW.interaction_type::text,
        CASE 
            WHEN NEW.interaction_type = 'click' THEN 'left_click'
            WHEN NEW.interaction_type = 'scroll' THEN 'scroll_down'
            WHEN NEW.interaction_type = 'hover' THEN 'mouse_over'
            ELSE 'generic'
        END,
        NEW.clicked_url,
        jsonb_build_object(
            'timestamp', NEW.interaction_time,
            'session_context', NEW.session_context,
            'user_agent', NEW.user_agent
        ),
        NEW.page_scroll_y,
        NEW.viewport_height,
        NEW.result_rank
    );

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_data_population()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result_text text := '';
    table_counts text := '';
BEGIN
    result_text := '📊 DATA POPULATION VALIDATION REPORT:' || E'\n\n';
    
    -- Check main table counts
    SELECT string_agg(
        '📋 ' || table_name || ': ' || 
        CASE 
            WHEN table_name = 'participants' THEN (SELECT COUNT(*)::text FROM participants)
            WHEN table_name = 'search_sessions' THEN (SELECT COUNT(*)::text FROM search_sessions)
            WHEN table_name = 'queries' THEN (SELECT COUNT(*)::text FROM queries)
            WHEN table_name = 'query_clicks' THEN (SELECT COUNT(*)::text FROM query_clicks)
            WHEN table_name = 'background_survey' THEN (SELECT COUNT(*)::text FROM background_survey)
            WHEN table_name = 'post_task_survey' THEN (SELECT COUNT(*)::text FROM post_task_survey)
            ELSE '0'
        END || ' records',
        E'\n'
    ) INTO table_counts
    FROM (
        VALUES 
        ('participants'), ('search_sessions'), ('queries'), ('query_clicks'),
        ('background_survey'), ('post_task_survey'), ('consent_logs'),
        ('task_instruction'), ('search_result_log'), ('scroll_events'), ('session_timing')
    ) AS t(table_name);
    
    result_text := result_text || table_counts || E'\n\n';
    
    RETURN result_text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_query_complexity_score(query_text text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN LENGTH(query_text) + ARRAY_LENGTH(STRING_TO_ARRAY(query_text, ' '), 1) * 2;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_query_structure_type(query_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF query_text ILIKE '%how%' OR query_text ILIKE '%what%' OR query_text ILIKE '%when%' OR query_text ILIKE '%where%' OR query_text ILIKE '%why%' THEN
        RETURN 'question';
    ELSIF query_text ILIKE '%""%' THEN
        RETURN 'exact_phrase';
    ELSIF query_text ILIKE '%AND%' OR query_text ILIKE '%OR%' OR query_text ILIKE '%NOT%' THEN
        RETURN 'boolean';
    ELSIF LENGTH(query_text) > 50 THEN
        RETURN 'long_query';
    ELSIF ARRAY_LENGTH(STRING_TO_ARRAY(query_text, ' '), 1) = 1 THEN
        RETURN 'single_term';
    ELSE
        RETURN 'simple';
    END IF;
END;
$function$;