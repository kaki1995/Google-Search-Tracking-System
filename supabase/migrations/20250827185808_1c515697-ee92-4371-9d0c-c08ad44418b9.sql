-- Security Fix Migration Part 4: Fix final batch of database functions with search_path
-- Complete all remaining functions to include SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.log_enhanced_query(p_session_id uuid, p_query_text text, p_query_order integer, p_previous_query_id uuid DEFAULT NULL::uuid, p_structure_type text DEFAULT NULL::text, p_complexity integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  query_uuid uuid;
BEGIN
  INSERT INTO public.experiment_queries (
    session_id, query_text, query_order, previous_query_id, 
    structure_type, complexity, query_start_time
  ) VALUES (
    p_session_id, p_query_text, p_query_order, p_previous_query_id,
    p_structure_type, p_complexity, now()
  ) RETURNING id INTO query_uuid;
  
  RETURN query_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_query_timing_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert or update timing metrics for the query
    INSERT INTO query_timing_metrics (
        query_id,
        search_duration_ms,
        time_to_first_click_ms,
        time_to_first_result,
        query_abandoned,
        query_end_time,
        results_loaded_count,
        user_clicked,
        user_scrolled
    )
    SELECT 
        eq.id,
        EXTRACT(EPOCH FROM (NOW() - eq.query_start_time)) * 1000,
        MIN(CASE WHEN i.user_clicked = true THEN i.time_to_first_click_ms END),
        MIN(i.time_to_first_result_ms),
        false, -- Not abandoned if we have interactions
        NOW(),
        COUNT(DISTINCT CASE WHEN i.interaction_kind = 'results_rendered' THEN i.result_rank END),
        BOOL_OR(i.user_clicked),
        BOOL_OR(i.user_scrolled)
    FROM experiment_queries eq
    LEFT JOIN interactions i ON eq.id = i.query_id
    WHERE eq.id = NEW.query_id
    GROUP BY eq.id, eq.query_start_time
    ON CONFLICT (query_id) DO UPDATE SET
        search_duration_ms = EXCLUDED.search_duration_ms,
        time_to_first_click_ms = COALESCE(query_timing_metrics.time_to_first_click_ms, EXCLUDED.time_to_first_click_ms),
        time_to_first_result = COALESCE(query_timing_metrics.time_to_first_result, EXCLUDED.time_to_first_result),
        query_end_time = EXCLUDED.query_end_time,
        results_loaded_count = GREATEST(query_timing_metrics.results_loaded_count, EXCLUDED.results_loaded_count),
        user_clicked = query_timing_metrics.user_clicked OR EXCLUDED.user_clicked,
        user_scrolled = query_timing_metrics.user_scrolled OR EXCLUDED.user_scrolled;

    RETURN NEW;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.update_query_derivatives()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Update query_end_time when interactions are inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE experiment_queries 
        SET query_end_time = GREATEST(COALESCE(query_end_time, NEW.interaction_time), NEW.interaction_time)
        WHERE id = NEW.query_id;
        
        -- Increment results_loaded_count for relevant interaction types
        -- Using 'page_view' as the closest match to 'results_loaded'
        IF NEW.interaction_type IN ('page_view') THEN
            UPDATE experiment_queries 
            SET results_loaded_count = COALESCE(results_loaded_count, 0) + 1
            WHERE id = NEW.query_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_query_complexity_and_structure()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.query_text IS NOT NULL THEN
        NEW.query_complexity_score := public.compute_query_complexity_score(NEW.query_text);
        NEW.query_structure_type := public.compute_query_structure_type(NEW.query_text);
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_task_duration_bucket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.task_duration IS NOT NULL AND NEW.task_duration ~ '^\d+$' THEN
        NEW.task_duration_bucket := public.bucket_task_duration(NEW.task_duration::integer);
    END IF;
    RETURN NEW;
END;
$function$;