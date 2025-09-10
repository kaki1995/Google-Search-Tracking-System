-- Fix post_task_survey table to match exact questions 19-29 order
-- Drop existing table and recreate with correct schema

DROP TABLE IF EXISTS public.post_task_survey CASCADE;

-- Create post_task_survey table with questions 19-29 in correct order
CREATE TABLE public.post_task_survey (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL,
    session_id UUID NOT NULL,
    
    -- Question 19: Topic familiarity (Likert 1-7)
    q19_topic_familiarity INTEGER,
    
    -- Question 20: Google search satisfaction (Likert 1-7)
    q20_google_satisfaction INTEGER,
    
    -- Question 21: Google search ease (Likert 1-7)
    q21_google_ease INTEGER,
    
    -- Question 22: Google search relevance (Likert 1-7)
    q22_google_relevance INTEGER,
    
    -- Question 23: Google search trust (Likert 1-7)
    q23_google_trust INTEGER,
    
    -- Question 24: Contradictory information handling (multiple choice)
    q24_contradictory_handling TEXT,
    
    -- Question 25: Tool effectiveness (Likert 1-7)
    q25_tool_effectiveness INTEGER,
    
    -- Question 26: Attention check (Likert 1-7)
    q26_attention_check INTEGER,
    
    -- Question 27: First response satisfaction (Likert 1-7)
    q27_first_response_satisfaction INTEGER,
    
    -- Question 28: Task duration (dropdown selection)
    q28_task_duration TEXT,
    
    -- Question 29: Future usage feedback (open text)
    q29_future_usage_feedback TEXT,
    
    -- Metadata
    ip_address TEXT,
    device_type TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.post_task_survey ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access (data collection)
CREATE POLICY "Allow insert for data collection" ON public.post_task_survey FOR INSERT WITH CHECK (true);

-- Create RLS policy for authenticated researchers to read
CREATE POLICY "authenticated_researchers_can_select_post_task_survey" ON public.post_task_survey FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX idx_post_task_survey_participant_id ON public.post_task_survey(participant_id);
CREATE INDEX idx_post_task_survey_session_id ON public.post_task_survey(session_id);