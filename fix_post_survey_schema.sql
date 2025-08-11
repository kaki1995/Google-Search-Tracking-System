-- Apply the post_survey schema migration to fix the database structure
-- This will update the table to have individual columns instead of JSONB

-- Check if the table has the new columns
DO $$
BEGIN
    -- Check if google_satisfaction column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'post_survey' 
        AND column_name = 'google_satisfaction'
    ) THEN
        -- The table still has the old JSONB schema, let's update it
        RAISE NOTICE 'Updating post_survey table to new schema...';
        
        -- Drop existing table (backup data first if needed)
        DROP TABLE IF EXISTS public.post_survey CASCADE;
        
        -- Create updated post_survey table with Google-focused questions
        CREATE TABLE public.post_survey (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
            
            -- Google-focused Likert Scale Questions (1-7)
            google_satisfaction INTEGER CHECK (google_satisfaction >= 1 AND google_satisfaction <= 7),
            google_ease INTEGER CHECK (google_ease >= 1 AND google_ease <= 7),
            google_relevance INTEGER CHECK (google_relevance >= 1 AND google_relevance <= 7),
            google_trust INTEGER CHECK (google_trust >= 1 AND google_trust <= 7),
            
            -- Query modification count
            google_query_modifications TEXT,
            
            -- Attention check (1-7)
            attention_check INTEGER CHECK (attention_check >= 1 AND attention_check <= 7),
            
            -- Open feedback
            google_open_feedback TEXT,
            
            -- Additional fields
            task_duration TEXT,
            search_tool_type TEXT,
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE public.post_survey ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy for public access
        CREATE POLICY "Allow public access to post_survey" ON public.post_survey FOR ALL USING (true);
        
        -- Create index for performance
        CREATE INDEX idx_post_survey_session_id ON public.post_survey(session_id);
        
        RAISE NOTICE 'post_survey table updated successfully with new schema!';
    ELSE
        RAISE NOTICE 'post_survey table already has the correct schema.';
    END IF;
END $$;

-- Verify the schema
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_survey' 
AND table_schema = 'public'
ORDER BY ordinal_position;
