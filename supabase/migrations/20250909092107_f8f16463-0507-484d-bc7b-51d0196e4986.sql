-- Drop existing post_task_survey table
DROP TABLE IF EXISTS public.post_task_survey CASCADE;

-- Create new post_task_survey table with individual columns for questions 19-29
CREATE TABLE public.post_task_survey (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL,
    q19_satisfaction INTEGER,
    q20_ease_of_use INTEGER,
    q21_relevance_google INTEGER,
    q22_trust INTEGER,
    q23_familiarity INTEGER,
    q24_effectiveness INTEGER,
    q25_attention_check INTEGER,
    q26_duration TEXT,
    q27_additional_details TEXT,
    q28_overall_experience TEXT,
    q29_recommendations TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    device_type TEXT
);

-- Enable Row Level Security
ALTER TABLE public.post_task_survey ENABLE ROW LEVEL SECURITY;

-- Create policies for post_task_survey
CREATE POLICY "allow_insert_post_task_survey_with_valid_participant" 
ON public.post_task_survey 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM participants p 
        WHERE p.participant_id = post_task_survey.participant_id
    )
);

CREATE POLICY "authenticated_researchers_can_select_post_task_survey" 
ON public.post_task_survey 
FOR SELECT 
USING (auth.uid() IS NOT NULL);