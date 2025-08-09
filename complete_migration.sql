-- Complete SQL to create survey_exits table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/wbguuipoggeamyzrfvbv/editor

-- Step 1: Check if survey_exits table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'survey_exits'
) AS survey_exits_exists;

-- Step 2: Create survey_exits table
CREATE TABLE IF NOT EXISTS public.survey_exits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('background', 'post_task', 'general')),
    exit_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    exit_reason TEXT, -- 'browser_close', 'tab_close', 'navigation_away', 'manual_exit', 'timeout', 'user_clicked_exit_study'
    time_spent_ms INTEGER, -- time spent on survey before exit
    questions_answered INTEGER DEFAULT 0, -- number of questions answered before exit
    form_data JSONB, -- partial form data at time of exit
    page_url TEXT, -- URL they were on when they exited
    user_agent TEXT, -- browser/device info
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Enable Row Level Security
ALTER TABLE public.survey_exits ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy to allow public access (for research experiment)
CREATE POLICY IF NOT EXISTS "Allow public access to survey_exits" 
ON public.survey_exits FOR ALL USING (true);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_exits_session_id ON public.survey_exits(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_exits_survey_type ON public.survey_exits(survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_exits_exit_time ON public.survey_exits(exit_time);
CREATE INDEX IF NOT EXISTS idx_survey_exits_exit_reason ON public.survey_exits(exit_reason);

-- Step 6: Add survey tracking columns to sessions table (if they don't exist)
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
END $$;

-- Step 7: Create function to update session status when survey exit is recorded
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

-- Step 8: Create trigger to automatically update session status
DROP TRIGGER IF EXISTS survey_exit_update_session ON public.survey_exits;
CREATE TRIGGER survey_exit_update_session
    AFTER INSERT ON public.survey_exits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_survey_status();

-- Step 9: Verify table creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'survey_exits' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'survey_exits table created successfully! 🎉' AS status;
