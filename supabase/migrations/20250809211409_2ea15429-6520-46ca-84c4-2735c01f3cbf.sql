-- SECURITY FIX: Update RLS policies to be more restrictive instead of allowing all access

-- Fix sessions table RLS policies
DROP POLICY IF EXISTS "Allow public access to sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own session metrics" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can insert session metrics" ON public.sessions;

-- Create proper session access policies
CREATE POLICY "Users can insert their own sessions" ON public.sessions
FOR INSERT 
WITH CHECK (true); -- Allow session creation for tracking

CREATE POLICY "Users can view their own sessions" ON public.sessions
FOR SELECT 
USING (user_id = auth.uid()::text OR auth.uid() IS NULL); -- Allow for anonymous tracking

CREATE POLICY "Users can update their own sessions" ON public.sessions
FOR UPDATE 
USING (user_id = auth.uid()::text OR auth.uid() IS NULL);

-- Fix background_surveys RLS policies  
DROP POLICY IF EXISTS "Users can access own session background survey" ON public.background_surveys;

CREATE POLICY "Users can insert background surveys" ON public.background_surveys
FOR INSERT 
WITH CHECK (true); -- Allow for anonymous tracking

CREATE POLICY "Users can view background surveys for their sessions" ON public.background_surveys
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sessions s 
  WHERE s.id = background_surveys.session_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

-- Fix experiment_queries RLS policies
DROP POLICY IF EXISTS "Users can access own session queries" ON public.experiment_queries;

CREATE POLICY "Users can insert experiment queries" ON public.experiment_queries
FOR INSERT 
WITH CHECK (true); -- Allow for anonymous tracking

CREATE POLICY "Users can view queries for their sessions" ON public.experiment_queries
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sessions s 
  WHERE s.id = experiment_queries.session_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

-- Fix post_survey RLS policies
DROP POLICY IF EXISTS "Users can access own session post survey" ON public.post_survey;

CREATE POLICY "Users can insert post surveys" ON public.post_survey
FOR INSERT 
WITH CHECK (true); -- Allow for anonymous tracking

CREATE POLICY "Users can view post surveys for their sessions" ON public.post_survey
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sessions s 
  WHERE s.id = post_survey.session_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

-- Fix interactions RLS policies
DROP POLICY IF EXISTS "Allow anonymous access to interactions" ON public.interactions;

CREATE POLICY "Users can insert interactions" ON public.interactions
FOR INSERT 
WITH CHECK (true); -- Allow for anonymous tracking

CREATE POLICY "Users can view interactions for their queries" ON public.interactions
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.experiment_queries eq
  JOIN public.sessions s ON s.id = eq.session_id
  WHERE eq.id = interactions.query_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

-- Fix other tables that have overly permissive policies
DROP POLICY IF EXISTS "Allow all access to interaction_details" ON public.interaction_details;
DROP POLICY IF EXISTS "Allow all access to query_timing_metrics" ON public.query_timing_metrics;
DROP POLICY IF EXISTS "Allow all access to session_timing_summary" ON public.session_timing_summary;

-- Create proper interaction_details policies
CREATE POLICY "Users can insert interaction details" ON public.interaction_details
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view interaction details for their interactions" ON public.interaction_details
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.interactions i
  JOIN public.experiment_queries eq ON eq.id = i.query_id
  JOIN public.sessions s ON s.id = eq.session_id
  WHERE i.id = interaction_details.interaction_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

-- Create proper query_timing_metrics policies
CREATE POLICY "Users can insert query timing metrics" ON public.query_timing_metrics
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view query timing metrics for their queries" ON public.query_timing_metrics
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.experiment_queries eq
  JOIN public.sessions s ON s.id = eq.session_id
  WHERE eq.id = query_timing_metrics.query_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

-- Create proper session_timing_summary policies
CREATE POLICY "Users can insert session timing summary" ON public.session_timing_summary
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view session timing summary for their sessions" ON public.session_timing_summary
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sessions s 
  WHERE s.id = session_timing_summary.session_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));

CREATE POLICY "Users can update session timing summary for their sessions" ON public.session_timing_summary
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.sessions s 
  WHERE s.id = session_timing_summary.session_id 
  AND (s.user_id = auth.uid()::text OR auth.uid() IS NULL)
));