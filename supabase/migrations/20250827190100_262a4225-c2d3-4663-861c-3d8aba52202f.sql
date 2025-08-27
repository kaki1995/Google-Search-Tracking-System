-- Security Fix Migration Part 5: Fix final remaining database functions with search_path
-- Complete all remaining functions to include SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.populate_session_timing_summary()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert or update session timing summary
    INSERT INTO session_timing_summary (
        session_id,
        avg_time_per_query,
        avg_time_to_click,
        clicks_per_query,
        total_clicks,
        total_searches,
        total_session_duration_ms,
        queries_per_minute,
        successful_queries,
        min_max_time_per_query
    )
    SELECT 
        s.id,
        AVG(eq.time_per_query_ms),
        AVG(i.time_to_first_click_ms),
        CASE 
            WHEN COUNT(DISTINCT eq.id) > 0 THEN COUNT(DISTINCT CASE WHEN i.user_clicked = true THEN i.id END)::decimal / COUNT(DISTINCT eq.id)
            ELSE 0 
        END,
        COUNT(DISTINCT CASE WHEN i.user_clicked = true THEN i.id END),
        COUNT(DISTINCT eq.id),
        EXTRACT(EPOCH FROM (MAX(eq.query_end_time) - MIN(eq.query_start_time))) * 1000,
        CASE 
            WHEN EXTRACT(EPOCH FROM (MAX(eq.query_end_time) - MIN(eq.query_start_time))) > 0 
            THEN COUNT(DISTINCT eq.id)::decimal / (EXTRACT(EPOCH FROM (MAX(eq.query_end_time) - MIN(eq.query_start_time)))/60)
            ELSE 0 
        END,
        COUNT(DISTINCT CASE WHEN i.user_clicked = true THEN eq.id END),
        CONCAT(MIN(eq.time_per_query_ms), '-', MAX(eq.time_per_query_ms))
    FROM sessions s
    LEFT JOIN experiment_queries eq ON s.id = eq.session_id
    LEFT JOIN interactions i ON eq.id = i.query_id
    WHERE s.id = COALESCE(NEW.session_id, OLD.session_id)
    GROUP BY s.id
    HAVING COUNT(DISTINCT eq.id) > 0
    ON CONFLICT (session_id) DO UPDATE SET
        avg_time_per_query = EXCLUDED.avg_time_per_query,
        avg_time_to_click = EXCLUDED.avg_time_to_click,
        clicks_per_query = EXCLUDED.clicks_per_query,
        total_clicks = EXCLUDED.total_clicks,
        total_searches = EXCLUDED.total_searches,
        total_session_duration_ms = EXCLUDED.total_session_duration_ms,
        queries_per_minute = EXCLUDED.queries_per_minute,
        successful_queries = EXCLUDED.successful_queries,
        min_max_time_per_query = EXCLUDED.min_max_time_per_query,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_session_timing_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_enhanced_interactions_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_survey_response_summary;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_user_sessions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert or update user session summary
    INSERT INTO user_sessions (
        user_id,
        session_count,
        first_session_date,
        last_session_date,
        total_queries,
        total_interactions,
        avg_session_duration,
        preferred_tool,
        demographics,
        behavior_metrics,
        performance_scores
    )
    SELECT 
        s.user_id,
        COUNT(DISTINCT s.id),
        MIN(s.created_at),
        MAX(s.created_at),
        COUNT(DISTINCT eq.id),
        COUNT(DISTINCT i.id),
        AVG(s.session_duration_ms / 1000.0 / 60.0), -- Convert to minutes
        MODE() WITHIN GROUP (ORDER BY s.tool_type),
        jsonb_build_object(
            'platforms', array_agg(DISTINCT s.platform),
            'browsers', array_agg(DISTINCT s.browser),
            'locations', array_agg(DISTINCT s.location)
        ),
        jsonb_build_object(
            'avg_queries_per_session', AVG(subq.session_queries),
            'avg_interactions_per_session', AVG(subq.session_interactions),
            'total_search_time_minutes', SUM(s.session_duration_ms / 1000.0 / 60.0)
        ),
        jsonb_build_object(
            'session_completion_rate', COUNT(DISTINCT ps.session_id)::decimal / COUNT(DISTINCT s.id),
            'avg_satisfaction', AVG(ps.google_satisfaction),
            'background_survey_completion', COUNT(DISTINCT bs.session_id)::decimal / COUNT(DISTINCT s.id)
        )
    FROM sessions s
    LEFT JOIN experiment_queries eq ON s.id = eq.session_id
    LEFT JOIN interactions i ON eq.id = i.query_id
    LEFT JOIN post_survey ps ON s.id = ps.session_id
    LEFT JOIN background_surveys bs ON s.id = bs.session_id
    LEFT JOIN (
        SELECT 
            s2.id as session_id,
            COUNT(DISTINCT eq2.id) as session_queries,
            COUNT(DISTINCT i2.id) as session_interactions
        FROM sessions s2
        LEFT JOIN experiment_queries eq2 ON s2.id = eq2.session_id
        LEFT JOIN interactions i2 ON eq2.id = i2.query_id
        GROUP BY s2.id
    ) subq ON s.id = subq.session_id
    WHERE s.user_id = NEW.user_id
    GROUP BY s.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        session_count = EXCLUDED.session_count,
        last_session_date = EXCLUDED.last_session_date,
        total_queries = EXCLUDED.total_queries,
        total_interactions = EXCLUDED.total_interactions,
        avg_session_duration = EXCLUDED.avg_session_duration,
        preferred_tool = EXCLUDED.preferred_tool,
        demographics = EXCLUDED.demographics,
        behavior_metrics = EXCLUDED.behavior_metrics,
        performance_scores = EXCLUDED.performance_scores,
        updated_at = NOW();

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_query_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Auto-calculate query complexity and structure if not provided
    IF NEW.query_complexity_score IS NULL THEN
        NEW.query_complexity_score := compute_query_complexity_score(NEW.query_text);
    END IF;
    
    IF NEW.query_structure_type IS NULL THEN
        NEW.query_structure_type := compute_query_structure_type(NEW.query_text);
    END IF;
    
    -- Set query start time if not provided
    IF NEW.query_start_time IS NULL THEN
        NEW.query_start_time := NOW();
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    REFRESH MATERIALIZED VIEW mv_enhanced_interactions_summary;
    REFRESH MATERIALIZED VIEW mv_session_timing_summary;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.compute_query_complexity(query_text text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN 
        LENGTH(query_text) + 
        (ARRAY_LENGTH(STRING_TO_ARRAY(query_text, ' '), 1) * 2) +
        (CASE WHEN query_text ~* '[\(\)]' THEN 3 ELSE 0 END) +
        (CASE WHEN query_text ~* '"' THEN 2 ELSE 0 END);
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_query_structure(query_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN 
        CASE 
            WHEN query_text ~* '^(how|what|when|where|why)' THEN 'question'
            WHEN query_text ~* '(AND|OR|NOT)' THEN 'boolean'
            WHEN query_text ~* '"[^"]+"' THEN 'exact_phrase'
            WHEN LENGTH(query_text) > 50 THEN 'complex'
            WHEN ARRAY_LENGTH(STRING_TO_ARRAY(query_text, ' '), 1) = 1 THEN 'single_term'
            ELSE 'standard'
        END;
END;
$function$;