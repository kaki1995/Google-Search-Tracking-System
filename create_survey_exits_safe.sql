-- Check if survey_exits table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'survey_exits'
);

-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.survey_exits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID,
    exit_reason TEXT NOT NULL,
    exit_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint if session table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE public.survey_exits 
        ADD CONSTRAINT fk_survey_exits_session_id 
        FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.survey_exits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY IF NOT EXISTS "Allow public access to survey_exits" 
ON public.survey_exits FOR ALL USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_survey_exits_session_id 
ON public.survey_exits(session_id);

-- Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS set_updated_at_survey_exits
    BEFORE UPDATE ON public.survey_exits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
