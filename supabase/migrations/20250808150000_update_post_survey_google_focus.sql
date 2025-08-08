-- Update post_survey table to match new Google-focused questions
-- Migration to align with updated PostTaskSurvey frontend form

-- Drop the existing table and recreate with new schema
DROP TABLE IF EXISTS public.post_survey CASCADE;

-- Create updated post_survey table with Google-focused questions
CREATE TABLE public.post_survey (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- New Google-focused Likert Scale Questions (1-7)
    google_satisfaction INTEGER CHECK (google_satisfaction >= 1 AND google_satisfaction <= 7),
    google_ease INTEGER CHECK (google_ease >= 1 AND google_ease <= 7),
    google_relevance INTEGER CHECK (google_relevance >= 1 AND google_relevance <= 7),
    google_trust INTEGER CHECK (google_trust >= 1 AND google_trust <= 7),
    
    -- Query modification count (0, 1, 2, 3, 4, 5+)
    google_query_modifications TEXT,
    
    -- Attention check (1-7)
    attention_check INTEGER CHECK (attention_check >= 1 AND attention_check <= 7),
    
    -- Open feedback (optional text field)
    google_open_feedback TEXT,
    
    -- Preserved original questions
    task_duration TEXT,
    search_tool_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_post_survey
    BEFORE UPDATE ON public.post_survey
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.post_survey ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access
CREATE POLICY "Allow public access to post_survey" ON public.post_survey FOR ALL USING (true);

-- Create index for performance
CREATE INDEX idx_post_survey_session_id ON public.post_survey(session_id);

-- Add comments for documentation
COMMENT ON TABLE public.post_survey IS 'Post-task survey responses focusing on Google search experience';
COMMENT ON COLUMN public.post_survey.google_satisfaction IS 'Q16: How satisfied were you with your Google search experience? (1-Not satisfied at all, 7-Very satisfied)';
COMMENT ON COLUMN public.post_survey.google_ease IS 'Q17: How easy was it to use Google''s search interface? (1-Not easy at all, 7-Very easy)';
COMMENT ON COLUMN public.post_survey.google_relevance IS 'Q18: How relevant were the Google search results to your query? (1-Not relevant at all, 7-Very relevant)';
COMMENT ON COLUMN public.post_survey.google_trust IS 'Q19: How much did you trust the Google search results? (1-Do not trust at all, 7-Trust completely)';
COMMENT ON COLUMN public.post_survey.google_query_modifications IS 'Q20: How many times did you modify your search query on Google? (0, 1, 2, 3, 4, 5+)';
COMMENT ON COLUMN public.post_survey.attention_check IS 'Q21: Please select ''3'' for this question (1-Strongly disagree, 7-Strongly agree)';
COMMENT ON COLUMN public.post_survey.google_open_feedback IS 'Q22: Is there anything else you would like to add about your Google search experience? (Optional)';
COMMENT ON COLUMN public.post_survey.task_duration IS 'Q27: Approximately how long did it take you to complete the task?';
COMMENT ON COLUMN public.post_survey.search_tool_type IS 'Q28: Which type of search tool did you use during the task?';
