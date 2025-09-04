-- Fix overly restrictive RLS policies to allow authenticated researcher access
-- Update SELECT policies to allow authenticated users (researchers) to access research data

-- Drop the existing overly restrictive SELECT policies
DROP POLICY IF EXISTS "researchers_can_select_background_survey" ON background_survey;
DROP POLICY IF EXISTS "researchers_can_select_consent_logs" ON consent_logs;
DROP POLICY IF EXISTS "researchers_can_select_participants" ON participants;
DROP POLICY IF EXISTS "researchers_can_select_post_task_survey" ON post_task_survey;
DROP POLICY IF EXISTS "researchers_can_select_queries" ON queries;
DROP POLICY IF EXISTS "researchers_can_select_query_clicks" ON query_clicks;
DROP POLICY IF EXISTS "researchers_can_select_scroll_events" ON scroll_events;
DROP POLICY IF EXISTS "researchers_can_select_search_result_log" ON search_result_log;
DROP POLICY IF EXISTS "researchers_can_select_search_sessions" ON search_sessions;
DROP POLICY IF EXISTS "researchers_can_select_session_timing" ON session_timing;
DROP POLICY IF EXISTS "researchers_can_select_task_instruction" ON task_instruction;

-- Create new policies that allow authenticated users (researchers) to access research data
-- This provides security by requiring authentication while allowing legitimate research access

CREATE POLICY "authenticated_researchers_can_select_background_survey" 
ON background_survey 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_consent_logs" 
ON consent_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_participants" 
ON participants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_post_task_survey" 
ON post_task_survey 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_queries" 
ON queries 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_query_clicks" 
ON query_clicks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_scroll_events" 
ON scroll_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_search_result_log" 
ON search_result_log 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_search_sessions" 
ON search_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_session_timing" 
ON session_timing 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_researchers_can_select_task_instruction" 
ON task_instruction 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Verification query to confirm policies are properly configured
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'background_survey', 'consent_logs', 'participants', 'post_task_survey',
  'queries', 'query_clicks', 'scroll_events', 'search_result_log', 
  'search_sessions', 'session_timing', 'task_instruction'
)
AND cmd = 'SELECT'
ORDER BY tablename, policyname;