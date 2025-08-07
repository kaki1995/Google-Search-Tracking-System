-- Update background_surveys table to capture all survey fields
-- Drop the table and recreate with complete schema

DROP TABLE IF EXISTS public.background_surveys CASCADE;

-- Create comprehensive background_surveys table
CREATE TABLE public.background_surveys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    
    -- Question 1: Age group
    age_group TEXT,
    
    -- Question 2: Gender
    gender TEXT,
    
    -- Question 3: Education level
    education TEXT,
    
    -- Question 4: Employment status
    employment TEXT,
    
    -- Question 5: Nationality
    nationality TEXT,
    
    -- Question 6: Country of residence
    country TEXT,
    
    -- Question 7: AI chatbots familiarity (1-7 scale)
    ai_chatbot_familiarity INTEGER CHECK (ai_chatbot_familiarity >= 1 AND ai_chatbot_familiarity <= 7),
    
    -- Question 8: Data quality check (1-7 scale)
    data_quality_check INTEGER CHECK (data_quality_check >= 1 AND data_quality_check <= 7),
    
    -- Question 9: AI chatbot usage frequency
    ai_chatbot_frequency TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_background_surveys
    BEFORE UPDATE ON public.background_surveys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.background_surveys ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access
CREATE POLICY "Allow public access to background_surveys" ON public.background_surveys FOR ALL USING (true);

-- Create index for performance
CREATE INDEX idx_background_surveys_session_id ON public.background_surveys(session_id);

-- Add comments for documentation
COMMENT ON TABLE public.background_surveys IS 'Background survey responses from research participants';
COMMENT ON COLUMN public.background_surveys.ai_chatbot_familiarity IS 'Question 7: How familiar are you with AI chatbots such as ChatGPT? (1-7 scale)';
COMMENT ON COLUMN public.background_surveys.data_quality_check IS 'Question 8: Data quality check question (1-7 scale)';
COMMENT ON COLUMN public.background_surveys.ai_chatbot_frequency IS 'Question 9: On average, how often do you use AI chatbots per week?';
