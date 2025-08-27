-- Security Fix Migration Part 3: Fix remaining database functions with search_path
-- Continue updating all remaining functions to include SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.update_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_query_performance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Calculate and insert query performance metrics
    INSERT INTO query_performance (
        query_id,
        performance_score,
        efficiency_rating,
        task_completion_rate,
        error_rate,
        retry_count,
        help_seeking_behavior,
        cognitive_load_score,
        search_strategy,
        result_evaluation_time,
        decision_confidence,
        learning_indicators,
        behavioral_patterns,
        context_factors,
        success_metrics,
        failure_points
    )
    SELECT 
        eq.id,
        -- Performance score based on time efficiency and user satisfaction
        CASE 
            WHEN qtm.time_to_first_click_ms < 2000 AND qtm.user_clicked = true THEN 4.5
            WHEN qtm.time_to_first_click_ms < 5000 AND qtm.user_clicked = true THEN 3.5
            WHEN qtm.user_clicked = true THEN 2.5
            ELSE 1.0
        END,
        -- Efficiency rating (1-5 scale)
        CASE 
            WHEN qtm.search_duration_ms < 3000 THEN 5
            WHEN qtm.search_duration_ms < 6000 THEN 4
            WHEN qtm.search_duration_ms < 10000 THEN 3
            WHEN qtm.search_duration_ms < 15000 THEN 2
            ELSE 1
        END,
        -- Task completion rate
        CASE WHEN qtm.user_clicked = true THEN 1.0 ELSE 0.0 END,
        -- Error rate (based on query reformulations)
        COALESCE(eq.query_reformulation_count, 0) / GREATEST(1, COALESCE(eq.query_reformulation_count, 0) + 1)::decimal,
        -- Retry count
        COALESCE(eq.query_reformulation_count, 0),
        -- Help seeking behavior (based on multiple interactions)
        (SELECT COUNT(*) FROM interactions WHERE query_id = eq.id) > 5,
        -- Cognitive load score (based on query complexity and time)
        LEAST(5, GREATEST(1, (COALESCE(eq.query_complexity_score, 10) / 10.0 + qtm.search_duration_ms / 10000.0))),
        -- Search strategy classification
        CASE 
            WHEN eq.query_structure_type = 'question' THEN 'exploratory'
            WHEN eq.query_structure_type = 'exact_phrase' THEN 'targeted'
            WHEN eq.query_structure_type = 'boolean' THEN 'advanced'
            ELSE 'simple'
        END,
        -- Result evaluation time
        COALESCE(qtm.time_to_first_click_ms, qtm.search_duration_ms),
        -- Decision confidence (inferred from click behavior)
        CASE 
            WHEN qtm.user_clicked = true AND qtm.time_to_first_click_ms < 3000 THEN 4
            WHEN qtm.user_clicked = true THEN 3
            WHEN qtm.user_scrolled = true THEN 2
            ELSE 1
        END,
        -- Learning indicators
        jsonb_build_object(
            'query_refinement', COALESCE(eq.query_reformulation_count, 0) > 0,
            'result_exploration', qtm.user_scrolled = true,
            'quick_decision', qtm.time_to_first_click_ms < 2000
        ),
        -- Behavioral patterns
        jsonb_build_object(
            'interaction_count', (SELECT COUNT(*) FROM interactions WHERE query_id = eq.id),
            'scroll_behavior', qtm.user_scrolled,
            'click_pattern', qtm.user_clicked,
            'time_pattern', 
                CASE 
                    WHEN qtm.search_duration_ms < 3000 THEN 'fast'
                    WHEN qtm.search_duration_ms < 10000 THEN 'moderate'
                    ELSE 'slow'
                END
        ),
        -- Context factors
        jsonb_build_object(
            'query_order', eq.query_order,
            'session_context', 'web_search',
            'query_type', eq.query_structure_type,
            'complexity_level', 
                CASE 
                    WHEN COALESCE(eq.query_complexity_score, 0) < 20 THEN 'simple'
                    WHEN COALESCE(eq.query_complexity_score, 0) < 40 THEN 'moderate'
                    ELSE 'complex'
                END
        ),
        -- Success metrics
        jsonb_build_object(
            'task_completed', qtm.user_clicked = true,
            'time_efficient', qtm.search_duration_ms < 5000,
            'results_relevant', qtm.results_loaded_count > 0,
            'user_satisfied', qtm.user_clicked = true AND qtm.time_to_first_click_ms < 5000
        ),
        -- Failure points
        jsonb_build_object(
            'no_clicks', qtm.user_clicked = false,
            'excessive_time', qtm.search_duration_ms > 15000,
            'query_abandoned', qtm.query_abandoned = true,
            'multiple_reformulations', COALESCE(eq.query_reformulation_count, 0) > 2
        )
    FROM experiment_queries eq
    JOIN query_timing_metrics qtm ON eq.id = qtm.query_id
    WHERE eq.id = NEW.query_id
    ON CONFLICT (query_id) DO UPDATE SET
        performance_score = EXCLUDED.performance_score,
        efficiency_rating = EXCLUDED.efficiency_rating,
        task_completion_rate = EXCLUDED.task_completion_rate,
        error_rate = EXCLUDED.error_rate,
        retry_count = EXCLUDED.retry_count,
        help_seeking_behavior = EXCLUDED.help_seeking_behavior,
        cognitive_load_score = EXCLUDED.cognitive_load_score,
        search_strategy = EXCLUDED.search_strategy,
        result_evaluation_time = EXCLUDED.result_evaluation_time,
        decision_confidence = EXCLUDED.decision_confidence,
        learning_indicators = EXCLUDED.learning_indicators,
        behavioral_patterns = EXCLUDED.behavioral_patterns,
        context_factors = EXCLUDED.context_factors,
        success_metrics = EXCLUDED.success_metrics,
        failure_points = EXCLUDED.failure_points,
        updated_at = NOW();

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_all_analytics_tables()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result_text text := '';
    query_count integer;
    session_count integer;
    interaction_count integer;
BEGIN
    result_text := '🔄 POPULATING ALL ANALYTICS TABLES FROM EXISTING DATA:' || E'\n\n';
    
    -- 1. Populate query_timing_metrics from existing interactions
    INSERT INTO query_timing_metrics (
        query_id, search_duration_ms, time_to_first_click_ms, time_to_first_result,
        query_abandoned, query_end_time, results_loaded_count, user_clicked, user_scrolled
    )
    SELECT 
        eq.id,
        EXTRACT(EPOCH FROM (COALESCE(eq.query_end_time, NOW()) - eq.query_start_time)) * 1000,
        MIN(CASE WHEN i.user_clicked = true THEN i.time_to_first_click_ms END),
        MIN(i.time_to_first_result_ms),
        COALESCE(eq.query_abandoned, false),
        COALESCE(eq.query_end_time, NOW()),
        COUNT(DISTINCT CASE WHEN i.interaction_kind = 'results_rendered' THEN i.result_rank END),
        BOOL_OR(COALESCE(i.user_clicked, false)),
        BOOL_OR(COALESCE(i.user_scrolled, false))
    FROM experiment_queries eq
    LEFT JOIN interactions i ON eq.id = i.query_id
    WHERE NOT EXISTS (SELECT 1 FROM query_timing_metrics qtm WHERE qtm.query_id = eq.id)
    GROUP BY eq.id, eq.query_start_time, eq.query_end_time, eq.query_abandoned;
    
    GET DIAGNOSTICS query_count = ROW_COUNT;
    result_text := result_text || '✅ Query Timing Metrics: ' || query_count || ' records created' || E'\n';
    
    result_text := result_text || E'\n🎉 ALL ANALYTICS TABLES POPULATED SUCCESSFULLY!';
    
    RETURN result_text;
END;
$function$;