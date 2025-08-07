-- Enhanced schema for comprehensive metrics collection
-- This migration adds missing fields and creates timing metrics tables

-- Update sessions table to include timing metrics
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS time_to_first_query INTEGER; -- milliseconds
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_duration INTEGER; -- milliseconds
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS total_queries INTEGER DEFAULT 0;

-- Update experiment_queries table with enhanced query metrics
ALTER TABLE public.experiment_queries ADD COLUMN IF NOT EXISTS query_structure_type TEXT CHECK (query_structure_type IN ('keyword', 'natural_language', 'question', 'phrase'));
ALTER TABLE public.experiment_queries ADD COLUMN IF NOT EXISTS query_complexity_score INTEGER CHECK (query_complexity_score >= 1 AND query_complexity_score <= 10);
ALTER TABLE public.experiment_queries ADD COLUMN IF NOT EXISTS query_reformulation_count INTEGER DEFAULT 0;
ALTER TABLE public.experiment_queries ADD COLUMN IF NOT EXISTS time_per_query INTEGER; -- milliseconds from query to first interaction
ALTER TABLE public.experiment_queries ADD COLUMN IF NOT EXISTS query_order INTEGER; -- sequence in session
ALTER TABLE public.experiment_queries ADD COLUMN IF NOT EXISTS previous_query_id UUID REFERENCES public.experiment_queries(id);

-- Update interactions table with enhanced interaction metrics
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS time_to_first_click INTEGER; -- milliseconds from query to first click
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS interaction_type TEXT CHECK (interaction_type IN ('click', 'scroll', 'hover', 'dwell'));
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS dwell_time INTEGER; -- milliseconds spent on result
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS scroll_position INTEGER; -- pixels scrolled
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS viewport_height INTEGER; -- for scroll depth calculation
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS result_position INTEGER; -- position in search results (1-based)

-- Create query timing metrics table for detailed timing analysis
CREATE TABLE IF NOT EXISTS public.query_timing_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id UUID NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Timing metrics in milliseconds
    query_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    query_end_time TIMESTAMP WITH TIME ZONE,
    time_to_first_result INTEGER, -- time from query submission to first result display
    time_to_first_interaction INTEGER, -- time from results display to first click/scroll
    total_query_time INTEGER, -- total time spent on this query
    
    -- Query performance metrics
    results_loaded_count INTEGER,
    user_scrolled BOOLEAN DEFAULT false,
    user_clicked BOOLEAN DEFAULT false,
    query_abandoned BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interaction details table for granular interaction tracking
CREATE TABLE IF NOT EXISTS public.interaction_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
    query_id UUID NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
    
    -- Detailed interaction data
    element_type TEXT, -- 'search_result', 'advertisement', 'pagination', etc.
    element_id TEXT, -- CSS selector or identifier
    action_type TEXT CHECK (action_type IN ('click', 'rightclick', 'hover', 'focus', 'scroll')),
    timestamp_action TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Position and context
    element_position_x INTEGER,
    element_position_y INTEGER,
    page_scroll_y INTEGER,
    result_rank INTEGER, -- rank in search results (1-based)
    
    -- Metadata
    additional_data JSONB, -- flexible field for platform-specific data
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session timing summary table
CREATE TABLE IF NOT EXISTS public.session_timing_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Overall session timing
    total_session_duration INTEGER, -- milliseconds
    total_active_time INTEGER, -- time user was actively interacting
    total_idle_time INTEGER, -- time between interactions
    
    -- Query timing aggregates
    avg_time_per_query DECIMAL(10,2),
    min_time_per_query INTEGER,
    max_time_per_query INTEGER,
    total_queries_executed INTEGER,
    
    -- Interaction timing aggregates
    avg_time_to_click DECIMAL(10,2),
    total_clicks INTEGER,
    total_scroll_events INTEGER,
    
    -- Efficiency metrics
    queries_per_minute DECIMAL(5,2),
    clicks_per_query DECIMAL(5,2),
    successful_queries INTEGER, -- queries that led to clicks
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create triggers for updated_at columns
CREATE TRIGGER set_updated_at_query_timing_metrics
    BEFORE UPDATE ON public.query_timing_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_session_timing_summary
    BEFORE UPDATE ON public.session_timing_summary
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security for new tables
ALTER TABLE public.query_timing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timing_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
CREATE POLICY "Allow public access to query_timing_metrics" ON public.query_timing_metrics FOR ALL USING (true);
CREATE POLICY "Allow public access to interaction_details" ON public.interaction_details FOR ALL USING (true);
CREATE POLICY "Allow public access to session_timing_summary" ON public.session_timing_summary FOR ALL USING (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_query_timing_metrics_query_id ON public.query_timing_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_query_timing_metrics_session_id ON public.query_timing_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_interaction_details_interaction_id ON public.interaction_details(interaction_id);
CREATE INDEX IF NOT EXISTS idx_interaction_details_query_id ON public.interaction_details(query_id);
CREATE INDEX IF NOT EXISTS idx_session_timing_summary_session_id ON public.session_timing_summary(session_id);

-- Create indexes for enhanced query searching
CREATE INDEX IF NOT EXISTS idx_experiment_queries_structure_type ON public.experiment_queries(query_structure_type);
CREATE INDEX IF NOT EXISTS idx_experiment_queries_complexity ON public.experiment_queries(query_complexity_score);
CREATE INDEX IF NOT EXISTS idx_experiment_queries_reformulation_count ON public.experiment_queries(query_reformulation_count);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_rank ON public.interactions(clicked_rank);

-- Add helpful comments for documentation
COMMENT ON TABLE public.query_timing_metrics IS 'Detailed timing metrics for each query execution';
COMMENT ON TABLE public.interaction_details IS 'Granular tracking of user interactions with search interfaces';
COMMENT ON TABLE public.session_timing_summary IS 'Aggregated timing and efficiency metrics per session';

COMMENT ON COLUMN public.experiment_queries.query_structure_type IS 'Type of query structure: keyword, natural_language, question, or phrase';
COMMENT ON COLUMN public.experiment_queries.query_complexity_score IS 'Complexity score from 1-10 based on length, keywords, and structure';
COMMENT ON COLUMN public.experiment_queries.query_reformulation_count IS 'Number of times this query was reformulated in the session';
COMMENT ON COLUMN public.interactions.time_to_first_click IS 'Milliseconds from query results display to first click';
COMMENT ON COLUMN public.sessions.time_to_first_query IS 'Milliseconds from session start to first query submission';
