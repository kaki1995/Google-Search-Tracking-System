-- Fix interactions table RLS policy to allow anonymous inserts
-- The current policy might be too restrictive for anonymous users

-- Drop existing policy
DROP POLICY IF EXISTS "Users can access own session interactions" ON public.interactions;

-- Create new policy that allows anonymous inserts and reads
CREATE POLICY "Allow anonymous access to interactions" 
ON public.interactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also ensure the table is properly set up for RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;