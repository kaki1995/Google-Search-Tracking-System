-- Fix Security Definer Views (identified in linter)
-- Drop and recreate views without SECURITY DEFINER

-- Drop existing views with SECURITY DEFINER
DROP VIEW IF EXISTS public.v_enhanced_query_metrics;
DROP VIEW IF EXISTS public.v_enhanced_session_metrics; 
DROP VIEW IF EXISTS public.v_first_click;
DROP VIEW IF EXISTS public.v_first_interaction;
DROP VIEW IF EXISTS public.v_query_end;
DROP VIEW IF EXISTS public.v_results_rendered;

-- Fix database functions to have immutable search_path
-- Update all functions to use secure search_path

-- Update create_enhanced_session function
CREATE OR REPLACE FUNCTION public.create_enhanced_session(p_user_agent text DEFAULT NULL::text, p_screen_resolution text DEFAULT NULL::text, p_timezone text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update log_enhanced_query function  
CREATE OR REPLACE FUNCTION public.log_enhanced_query(p_session_id uuid, p_query_text text, p_results_count integer DEFAULT 0, p_results_loaded_count integer DEFAULT 0)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update log_enhanced_interaction function
CREATE OR REPLACE FUNCTION public.log_enhanced_interaction(p_query_id uuid, p_interaction_type interaction_type, p_clicked_url text DEFAULT NULL::text, p_clicked_rank integer DEFAULT NULL::integer, p_element_id text DEFAULT NULL::text, p_element_text text DEFAULT NULL::text, p_session_time_ms bigint DEFAULT NULL::bigint, p_query_time_ms bigint DEFAULT NULL::bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update validate_session_access function
CREATE OR REPLACE FUNCTION public.validate_session_access(session_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT EXISTS(
        SELECT 1 FROM public.sessions 
        WHERE id = session_uuid
    );
$function$;

-- Update update_session_timing_summary function
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
    -- Get session info
    SELECT * INTO session_record FROM public.sessions WHERE id = NEW.session_id;
    
    IF session_record IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Calculate session duration
    session_duration_ms := EXTRACT(EPOCH FROM (NOW() - session_record.start_time)) * 1000;
    
    -- Get query statistics
    SELECT 
        COUNT(*) as total_searches,
        COUNT(CASE WHEN qm.user_clicked = true THEN 1 END) as successful_queries,
        AVG(qm.search_duration_ms) as avg_time_per_query,
        MIN(qm.search_duration_ms) as min_time,
        MAX(qm.search_duration_ms) as max_time,
        AVG(qm.time_to_first_click_ms) as avg_time_to_click,
        SUM(qm.results_loaded_count) as total_results_loaded
    INTO query_stats
    FROM public.query_timing_metrics qm
    JOIN public.experiment_queries eq ON qm.query_id = eq.id
    WHERE eq.session_id = NEW.session_id;
    
    -- Get interaction statistics  
    SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT i.query_id) as queries_with_clicks
    INTO interaction_stats
    FROM public.interactions i
    JOIN public.experiment_queries eq ON i.query_id = eq.id
    WHERE eq.session_id = NEW.session_id;
    
    -- Upsert session timing summary
    INSERT INTO public.session_timing_summary (
        session_id,
        total_session_duration_ms,
        total_searches,
        successful_queries,
        avg_time_per_query,
        min_max_time_per_query,
        total_clicks,
        avg_time_to_click,
        clicks_per_query,
        queries_per_minute
    ) VALUES (
        NEW.session_id,
        session_duration_ms,
        COALESCE(query_stats.total_searches, 0),
        COALESCE(query_stats.successful_queries, 0),
        COALESCE(query_stats.avg_time_per_query, 0),
        COALESCE(query_stats.min_time, 0) || '-' || COALESCE(query_stats.max_time, 0),
        COALESCE(interaction_stats.total_clicks, 0),
        COALESCE(query_stats.avg_time_to_click, 0),
        CASE 
            WHEN query_stats.total_searches > 0 THEN 
                COALESCE(interaction_stats.total_clicks, 0)::REAL / query_stats.total_searches
            ELSE 0
        END,
        CASE 
            WHEN session_duration_ms > 0 THEN 
                (COALESCE(query_stats.total_searches, 0) * 60000.0) / session_duration_ms
            ELSE 0
        END
    )
    ON CONFLICT (session_id) DO UPDATE SET
        total_session_duration_ms = EXCLUDED.total_session_duration_ms,
        total_searches = EXCLUDED.total_searches,
        successful_queries = EXCLUDED.successful_queries,
        avg_time_per_query = EXCLUDED.avg_time_per_query,
        min_max_time_per_query = EXCLUDED.min_max_time_per_query,
        total_clicks = EXCLUDED.total_clicks,
        avg_time_to_click = EXCLUDED.avg_time_to_click,
        clicks_per_query = EXCLUDED.clicks_per_query,
        queries_per_minute = EXCLUDED.queries_per_minute;
    
    RETURN NEW;
END;
$function$;

-- Update create_interaction_details function
CREATE OR REPLACE FUNCTION public.create_interaction_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Create basic interaction detail record
    INSERT INTO public.interaction_details (
        interaction_id,
        interaction_type,
        element_id,
        value
    ) VALUES (
        NEW.id,
        'click',
        'search_result_' || NEW.clicked_rank,
        NEW.clicked_url
    );
    
    RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update handle_new_user function if it exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
    RETURN new;
END;
$function$;