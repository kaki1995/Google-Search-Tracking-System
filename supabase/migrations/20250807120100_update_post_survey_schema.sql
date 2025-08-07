-- Update post_survey table to capture all survey fields
-- Drop the table and recreate with complete schema

DROP TABLE IF EXISTS public.post_survey CASCADE;

-- Create comprehensive post_survey table  
CREATE TABLE public.post_survey (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Likert Scale Questions (1-7)
    search_familiarity INTEGER CHECK (search_familiarity >= 1 AND search_familiarity <= 7),
    search_confidence INTEGER CHECK (search_confidence >= 1 AND search_confidence <= 7),
    search_satisfaction INTEGER CHECK (search_satisfaction >= 1 AND search_satisfaction <= 7),
    search_efficiency INTEGER CHECK (search_efficiency >= 1 AND search_efficiency <= 7),
    search_ease INTEGER CHECK (search_ease >= 1 AND search_ease <= 7),
    search_usefulness INTEGER CHECK (search_usefulness >= 1 AND search_usefulness <= 7),
    search_support INTEGER CHECK (search_support >= 1 AND search_support <= 7),
    search_system_ease INTEGER CHECK (search_system_ease >= 1 AND search_system_ease <= 7),
    search_again INTEGER CHECK (search_again >= 1 AND search_again <= 7),
    
    -- Advertisement emotion questions (1-7)
    advertisement_shameful INTEGER CHECK (advertisement_shameful >= 1 AND advertisement_shameful <= 7),
    advertisement_hopeful INTEGER CHECK (advertisement_hopeful >= 1 AND advertisement_hopeful <= 7),
    
    -- Task duration
    task_duration TEXT,
    
    -- Search tool type
    search_tool_type TEXT,
    
    -- Search improvement suggestions (text field)
    search_improvement TEXT,
    
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
COMMENT ON TABLE public.post_survey IS 'Post-task survey responses from research participants';
COMMENT ON COLUMN public.post_survey.search_familiarity IS 'Q16: How familiar are you with using search interfaces for product research?';
COMMENT ON COLUMN public.post_survey.search_confidence IS 'Q17: How confident did you feel while using the search interface?';
COMMENT ON COLUMN public.post_survey.search_satisfaction IS 'Q18: How satisfied are you with your search experience?';
COMMENT ON COLUMN public.post_survey.search_efficiency IS 'Q19: How efficiently were you able to find the information you needed?';
COMMENT ON COLUMN public.post_survey.search_ease IS 'Q20: How easy was it to use the search interface?';
COMMENT ON COLUMN public.post_survey.search_usefulness IS 'Q21: How useful was the search interface for completing your task?';
COMMENT ON COLUMN public.post_survey.search_support IS 'Q22: How well did the search interface support your decision-making process?';
COMMENT ON COLUMN public.post_survey.search_system_ease IS 'Q23: How easy was it to learn to use the search system?';
COMMENT ON COLUMN public.post_survey.search_again IS 'Q24: How likely would you be to use this search interface again?';
COMMENT ON COLUMN public.post_survey.advertisement_shameful IS 'Q25: Advertisement emotion - shameful (1-7 scale)';
COMMENT ON COLUMN public.post_survey.advertisement_hopeful IS 'Q26: Advertisement emotion - hopeful (1-7 scale)';
COMMENT ON COLUMN public.post_survey.task_duration IS 'Q27: Approximately how long did it take you to complete the task?';
COMMENT ON COLUMN public.post_survey.search_tool_type IS 'Q28: Which type of search tool did you use during the task?';
