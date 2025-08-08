-- Enable real-time for the three tables
ALTER TABLE public.interaction_details REPLICA IDENTITY FULL;
ALTER TABLE public.query_timing_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.session_timing_summary REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_details;
ALTER PUBLICATION supabase_realtime ADD TABLE public.query_timing_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_timing_summary;

-- Create function to update session timing summary automatically
CREATE OR REPLACE FUNCTION public.update_session_timing_summary()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update session timing summary
CREATE TRIGGER update_session_summary_on_query_timing
    AFTER INSERT OR UPDATE ON public.query_timing_metrics
    FOR EACH ROW EXECUTE FUNCTION public.update_session_timing_summary();

CREATE TRIGGER update_session_summary_on_interaction
    AFTER INSERT OR UPDATE ON public.interactions
    FOR EACH ROW EXECUTE FUNCTION public.update_session_timing_summary();

-- Create function to auto-populate interaction details
CREATE OR REPLACE FUNCTION public.create_interaction_details()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-populate interaction details
CREATE TRIGGER create_interaction_details_trigger
    AFTER INSERT ON public.interactions
    FOR EACH ROW EXECUTE FUNCTION public.create_interaction_details();