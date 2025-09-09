-- Create or update search_result_log table to properly capture all answers from search result log page
DROP TABLE IF EXISTS public.search_result_log CASCADE;

CREATE TABLE public.search_result_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL,
    session_id UUID NOT NULL,
    -- Questions 12-16: Basic smartphone details
    q12_smartphone_model TEXT, -- Brand and model of smartphone
    q13_storage_capacity TEXT, -- Storage capacity
    q14_color TEXT, -- Color
    q15_lowest_price TEXT, -- Lowest price found
    q16_website_link TEXT, -- Website link
    -- Questions 17-18: Preferences and features
    q17_price_importance TEXT, -- Price vs technical specifications (Likert scale)
    q18_smartphone_features TEXT, -- Important features (JSON array as text)
    -- Metadata
    ip_address TEXT,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create or update post_task_survey table to capture all questions 19-29
DROP TABLE IF EXISTS public.post_task_survey CASCADE;

CREATE TABLE public.post_task_survey (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL,
    session_id UUID NOT NULL,
    -- Questions 19-24: Satisfaction ratings (1-5 scale)
    q19_satisfaction INTEGER, -- Overall satisfaction with Google search
    q20_ease_of_use INTEGER, -- Ease of use
    q21_relevance_google INTEGER, -- Relevance of Google results
    q22_trust INTEGER, -- Trust in results
    q23_familiarity INTEGER, -- Familiarity with search tools
    q24_effectiveness INTEGER, -- Effectiveness for task
    -- Question 25: Attention check
    q25_attention_check INTEGER, -- Attention check question
    -- Questions 26-29: Open-ended responses
    q26_duration TEXT, -- Duration category
    q27_additional_details TEXT, -- Additional details about experience
    q28_overall_experience TEXT, -- Overall experience description
    q29_recommendations TEXT, -- Recommendations for improvement
    -- Metadata
    ip_address TEXT,
    device_type TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.search_result_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_task_survey ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_result_log
CREATE POLICY "Allow insert for data collection" 
ON public.search_result_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "authenticated_researchers_can_select_search_result_log" 
ON public.search_result_log 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for post_task_survey
CREATE POLICY "Allow insert for data collection" 
ON public.post_task_survey 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "authenticated_researchers_can_select_post_task_survey" 
ON public.post_task_survey 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add helpful comments
COMMENT ON TABLE public.search_result_log IS 'Captures participant responses from the search result log page (questions 12-18)';
COMMENT ON TABLE public.post_task_survey IS 'Captures participant responses from the post-task survey page (questions 19-29)';

-- Create indexes for better query performance
CREATE INDEX idx_search_result_log_participant ON public.search_result_log(participant_id);
CREATE INDEX idx_search_result_log_session ON public.search_result_log(session_id);
CREATE INDEX idx_search_result_log_created ON public.search_result_log(created_at);

CREATE INDEX idx_post_task_survey_participant ON public.post_task_survey(participant_id);
CREATE INDEX idx_post_task_survey_session ON public.post_task_survey(session_id);
CREATE INDEX idx_post_task_survey_submitted ON public.post_task_survey(submitted_at);