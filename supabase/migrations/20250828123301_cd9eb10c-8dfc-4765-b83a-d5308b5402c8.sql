-- Security Fix: Restrict SELECT access on all research participant data tables
-- This prevents unauthorized access to participant data while maintaining data collection functionality

-- 1. Add SELECT policies for background_survey table
CREATE POLICY "researchers_can_select_background_survey" 
ON public.background_survey 
FOR SELECT 
USING (false); -- No public SELECT access - only authorized researchers can access via service role

-- 2. Add SELECT policies for consent_logs table  
CREATE POLICY "researchers_can_select_consent_logs"
ON public.consent_logs
FOR SELECT
USING (false); -- No public SELECT access

-- 3. Add SELECT policies for participants table
CREATE POLICY "researchers_can_select_participants"
ON public.participants
FOR SELECT
USING (false); -- No public SELECT access

-- 4. Add SELECT policies for post_task_survey table
CREATE POLICY "researchers_can_select_post_task_survey"
ON public.post_task_survey
FOR SELECT
USING (false); -- No public SELECT access

-- 5. Add SELECT policies for queries table
CREATE POLICY "researchers_can_select_queries"
ON public.queries
FOR SELECT
USING (false); -- No public SELECT access

-- 6. Add SELECT policies for query_clicks table
CREATE POLICY "researchers_can_select_query_clicks"
ON public.query_clicks
FOR SELECT
USING (false); -- No public SELECT access

-- 7. Add SELECT policies for scroll_events table
CREATE POLICY "researchers_can_select_scroll_events"
ON public.scroll_events
FOR SELECT
USING (false); -- No public SELECT access

-- 8. Add SELECT policies for search_result_log table
CREATE POLICY "researchers_can_select_search_result_log"
ON public.search_result_log
FOR SELECT
USING (false); -- No public SELECT access

-- 9. Add SELECT policies for search_sessions table
CREATE POLICY "researchers_can_select_search_sessions"
ON public.search_sessions
FOR SELECT
USING (false); -- No public SELECT access

-- 10. Add SELECT policies for session_timing table
CREATE POLICY "researchers_can_select_session_timing"
ON public.session_timing
FOR SELECT
USING (false); -- No public SELECT access

-- 11. Add SELECT policies for task_instruction table
CREATE POLICY "researchers_can_select_task_instruction"
ON public.task_instruction
FOR SELECT
USING (false); -- No public SELECT access

-- Note: Data collection functionality remains intact as INSERT policies are unchanged
-- Research data access now requires service role key authentication