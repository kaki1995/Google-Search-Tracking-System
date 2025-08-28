-- Fix Security Issue: Remove Public Access to Participant Data Tables
-- Replace public access policies with secure, restricted access policies

-- Drop existing public access policies
DROP POLICY IF EXISTS "Allow public access to search_result_log" ON public.search_result_log;
DROP POLICY IF EXISTS "Allow public access to scroll_events" ON public.scroll_events;
DROP POLICY IF EXISTS "Allow public access to session_timing" ON public.session_timing;

-- Create secure policies for search_result_log
-- Allow inserts for data collection but no public reads
CREATE POLICY "Allow insert for data collection" 
ON public.search_result_log 
FOR INSERT 
WITH CHECK (true);

-- Create secure policies for scroll_events
-- Allow inserts for data collection but no public reads
CREATE POLICY "Allow insert for data collection" 
ON public.scroll_events 
FOR INSERT 
WITH CHECK (true);

-- Create secure policies for session_timing
-- Allow inserts for data collection but no public reads
CREATE POLICY "Allow insert for data collection" 
ON public.session_timing 
FOR INSERT 
WITH CHECK (true);

-- Optional: Create policies for authorized research access (commented out for now)
-- These would be used if you need to add research dashboard functionality later
-- 
-- CREATE POLICY "Researchers can view search_result_log" 
-- ON public.search_result_log 
-- FOR SELECT 
-- USING (auth.uid() IN (SELECT user_id FROM public.researchers));
--
-- CREATE POLICY "Researchers can view scroll_events" 
-- ON public.scroll_events 
-- FOR SELECT 
-- USING (auth.uid() IN (SELECT user_id FROM public.researchers));
--
-- CREATE POLICY "Researchers can view session_timing" 
-- ON public.session_timing 
-- FOR SELECT 
-- USING (auth.uid() IN (SELECT user_id FROM public.researchers));