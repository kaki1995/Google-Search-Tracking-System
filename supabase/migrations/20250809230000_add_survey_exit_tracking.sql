-- Survey exit tracking migration (safe version)
-- This migration adds fields to track when users exit surveys without completing them

-- Add survey tracking fields to sessions table (safe)
DO $$
BEGIN
    -- Add background survey status fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'background_survey_status') THEN
        ALTER TABLE public.sessions ADD COLUMN background_survey_status TEXT DEFAULT 'not_started' CHECK (background_survey_status IN ('not_started', 'in_progress', 'completed', 'exited'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'background_survey_exit_time') THEN
        ALTER TABLE public.sessions ADD COLUMN background_survey_exit_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'background_survey_exit_reason') THEN
        ALTER TABLE public.sessions ADD COLUMN background_survey_exit_reason TEXT;
    END IF;

    -- Add post survey status fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'post_survey_status') THEN
        ALTER TABLE public.sessions ADD COLUMN post_survey_status TEXT DEFAULT 'not_started' CHECK (post_survey_status IN ('not_started', 'in_progress', 'completed', 'exited'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'post_survey_exit_time') THEN
        ALTER TABLE public.sessions ADD COLUMN post_survey_exit_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'post_survey_exit_reason') THEN
        ALTER TABLE public.sessions ADD COLUMN post_survey_exit_reason TEXT;
    END IF;

    -- Add survey progress tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'background_survey_start_time') THEN
        ALTER TABLE public.sessions ADD COLUMN background_survey_start_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'background_survey_completion_time') THEN
        ALTER TABLE public.sessions ADD COLUMN background_survey_completion_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'post_survey_start_time') THEN
        ALTER TABLE public.sessions ADD COLUMN post_survey_start_time TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'post_survey_completion_time') THEN
        ALTER TABLE public.sessions ADD COLUMN post_survey_completion_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create survey_exits table for detailed exit tracking
CREATE TABLE IF NOT EXISTS public.survey_exits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('background', 'post_task')),
    exit_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    exit_reason TEXT, -- 'browser_close', 'tab_close', 'navigation_away', 'manual_exit', 'timeout'
    time_spent_ms INTEGER, -- time spent on survey before exit
    questions_answered INTEGER DEFAULT 0, -- number of questions answered before exit
    form_data JSONB, -- partial form data at time of exit
    page_url TEXT, -- URL they were on when they exited
    user_agent TEXT, -- browser/device info
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.survey_exits ENABLE ROW LEVEL SECURITY;

-- Create trigger for survey exit tracking
CREATE OR REPLACE FUNCTION public.update_session_survey_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the corresponding session status when a survey exit is recorded
    IF NEW.survey_type = 'background' THEN
        UPDATE public.sessions 
        SET 
            background_survey_status = 'exited',
            background_survey_exit_time = NEW.exit_time,
            background_survey_exit_reason = NEW.exit_reason
        WHERE id = NEW.session_id;
    ELSIF NEW.survey_type = 'post_task' THEN
        UPDATE public.sessions 
        SET 
            post_survey_status = 'exited',
            post_survey_exit_time = NEW.exit_time,
            post_survey_exit_reason = NEW.exit_reason
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER survey_exit_update_session
    AFTER INSERT ON public.survey_exits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_survey_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_exits_session_id ON public.survey_exits(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_exits_survey_type ON public.survey_exits(survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_exits_exit_time ON public.survey_exits(exit_time);
CREATE INDEX IF NOT EXISTS idx_sessions_background_survey_status ON public.sessions(background_survey_status);
CREATE INDEX IF NOT EXISTS idx_sessions_post_survey_status ON public.sessions(post_survey_status);
