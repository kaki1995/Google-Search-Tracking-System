-- Enhanced Response Persistence Database Migration
-- Run this in your Supabase SQL Editor

-- ================================================================
-- STEP 1: Create Response Persistence Tables
-- ================================================================

-- Create saved_responses table for storing user responses during the study
CREATE TABLE IF NOT EXISTS public.saved_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL, -- 'background_survey', 'task_instruction', 'search_result_log', 'post_task_survey'
    response_data JSONB NOT NULL, -- The actual form responses
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure one record per participant per page (for latest responses)
    CONSTRAINT unique_participant_page UNIQUE (participant_id, page_id)
);

-- Create response_history table for tracking response changes over time
CREATE TABLE IF NOT EXISTS public.response_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    response_data JSONB NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'navigate_away', 'navigate_back')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================================
-- STEP 2: Enable Row Level Security
-- ================================================================

ALTER TABLE public.saved_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (research experiment)
CREATE POLICY IF NOT EXISTS "Allow public access to saved_responses" 
ON public.saved_responses FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Allow public access to response_history" 
ON public.response_history FOR ALL USING (true);

-- ================================================================
-- STEP 3: Create Performance Indexes
-- ================================================================

-- Indexes for saved_responses
CREATE INDEX IF NOT EXISTS idx_saved_responses_participant_id ON public.saved_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_saved_responses_session_id ON public.saved_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_responses_page_id ON public.saved_responses(page_id);
CREATE INDEX IF NOT EXISTS idx_saved_responses_updated_at ON public.saved_responses(updated_at);

-- Indexes for response_history
CREATE INDEX IF NOT EXISTS idx_response_history_participant_id ON public.response_history(participant_id);
CREATE INDEX IF NOT EXISTS idx_response_history_session_id ON public.response_history(session_id);
CREATE INDEX IF NOT EXISTS idx_response_history_page_id ON public.response_history(page_id);
CREATE INDEX IF NOT EXISTS idx_response_history_created_at ON public.response_history(created_at);
CREATE INDEX IF NOT EXISTS idx_response_history_change_type ON public.response_history(change_type);

-- ================================================================
-- STEP 4: Create Automatic Timestamp Update Function
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS update_saved_responses_updated_at ON public.saved_responses;
CREATE TRIGGER update_saved_responses_updated_at
    BEFORE UPDATE ON public.saved_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- STEP 5: Create Response History Tracking Function
-- ================================================================

CREATE OR REPLACE FUNCTION public.log_response_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change to response_history
    INSERT INTO public.response_history (
        participant_id,
        session_id, 
        page_id,
        response_data,
        change_type
    ) VALUES (
        COALESCE(NEW.participant_id, OLD.participant_id),
        COALESCE(NEW.session_id, OLD.session_id),
        COALESCE(NEW.page_id, OLD.page_id),
        COALESCE(NEW.response_data, OLD.response_data),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'navigate_away'
            ELSE 'unknown'
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for response history logging
DROP TRIGGER IF EXISTS log_saved_responses_changes ON public.saved_responses;
CREATE TRIGGER log_saved_responses_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.saved_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.log_response_change();

-- ================================================================
-- STEP 6: Add Response Persistence Columns to Existing Tables
-- ================================================================

-- Add response persistence tracking to sessions table
DO $$
BEGIN
    -- Track response persistence metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'total_response_changes') THEN
        ALTER TABLE public.sessions ADD COLUMN total_response_changes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'pages_with_saved_responses') THEN
        ALTER TABLE public.sessions ADD COLUMN pages_with_saved_responses TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'last_response_save_time') THEN
        ALTER TABLE public.sessions ADD COLUMN last_response_save_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Track navigation patterns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'navigation_events') THEN
        ALTER TABLE public.sessions ADD COLUMN navigation_events INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'back_navigation_count') THEN
        ALTER TABLE public.sessions ADD COLUMN back_navigation_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ================================================================
-- STEP 7: Create Response Analytics Functions
-- ================================================================

-- Function to get response completion status for a participant
CREATE OR REPLACE FUNCTION public.get_response_completion_status(p_participant_id UUID)
RETURNS TABLE (
    page_id TEXT,
    has_responses BOOLEAN,
    response_count INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.page_id,
        (sr.response_data IS NOT NULL AND jsonb_object_keys(sr.response_data) IS NOT NULL) as has_responses,
        (SELECT COUNT(*) FROM jsonb_object_keys(sr.response_data)) as response_count,
        sr.updated_at as last_updated,
        CASE 
            WHEN sr.page_id = 'background_survey' THEN 
                LEAST(100, ((SELECT COUNT(*) FROM jsonb_object_keys(sr.response_data)) * 100.0 / 9))
            WHEN sr.page_id = 'task_instruction' THEN 
                LEAST(100, ((SELECT COUNT(*) FROM jsonb_object_keys(sr.response_data)) * 100.0 / 1))
            WHEN sr.page_id = 'search_result_log' THEN 
                LEAST(100, ((SELECT COUNT(*) FROM jsonb_object_keys(sr.response_data)) * 100.0 / 5))
            WHEN sr.page_id = 'post_task_survey' THEN 
                LEAST(100, ((SELECT COUNT(*) FROM jsonb_object_keys(sr.response_data)) * 100.0 / 9))
            ELSE 0
        END as completion_percentage
    FROM public.saved_responses sr
    WHERE sr.participant_id = p_participant_id
    ORDER BY sr.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get response change statistics
CREATE OR REPLACE FUNCTION public.get_response_statistics(p_participant_id UUID)
RETURNS TABLE (
    total_changes INTEGER,
    pages_modified INTEGER,
    navigation_back_events INTEGER,
    total_time_spent INTERVAL,
    most_edited_page TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_changes,
        COUNT(DISTINCT rh.page_id)::INTEGER as pages_modified,
        COUNT(CASE WHEN rh.change_type = 'navigate_back' THEN 1 END)::INTEGER as navigation_back_events,
        (MAX(rh.created_at) - MIN(rh.created_at)) as total_time_spent,
        (SELECT rh2.page_id 
         FROM public.response_history rh2 
         WHERE rh2.participant_id = p_participant_id 
         GROUP BY rh2.page_id 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_edited_page
    FROM public.response_history rh
    WHERE rh.participant_id = p_participant_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- STEP 8: Create Response Cleanup Functions
-- ================================================================

-- Function to clean up old response data
CREATE OR REPLACE FUNCTION public.cleanup_old_responses(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete response history older than specified days
    DELETE FROM public.response_history 
    WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Keep saved_responses as they're needed for active sessions
    -- Only delete if the session is also old and completed
    DELETE FROM public.saved_responses sr
    WHERE EXISTS (
        SELECT 1 FROM public.sessions s 
        WHERE s.id = sr.session_id 
        AND s.end_time IS NOT NULL 
        AND s.end_time < (CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- STEP 9: Verify Installation
-- ================================================================

-- Check that all tables were created successfully
SELECT 
    'saved_responses' as table_name,
    COUNT(*) as record_count,
    'Response persistence main table' as description
FROM public.saved_responses
UNION ALL
SELECT 
    'response_history' as table_name,
    COUNT(*) as record_count,
    'Response change tracking table' as description
FROM public.response_history
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as record_count,
    'Updated sessions table with response tracking' as description
FROM public.sessions;

-- Check that all indexes were created
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('saved_responses', 'response_history')
ORDER BY tablename, indexname;

-- Check that all functions were created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_updated_at_column',
    'log_response_change', 
    'get_response_completion_status',
    'get_response_statistics',
    'cleanup_old_responses'
)
ORDER BY routine_name;

-- Success message
SELECT 'Enhanced Response Persistence Database Migration Completed Successfully!' as status;
