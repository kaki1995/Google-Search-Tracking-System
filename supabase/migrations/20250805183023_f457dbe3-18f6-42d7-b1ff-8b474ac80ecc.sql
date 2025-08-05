-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_type TEXT,
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  background_survey JSONB,
  search_experience_log_1 JSONB,
  search_experience_log_2 JSONB,
  final_choice_url TEXT,
  decision_confidence INTEGER,
  completed BOOLEAN DEFAULT false,
  exited_early BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create queries table
CREATE TABLE IF NOT EXISTS public.queries (
  query_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.user_sessions(session_id),
  query_text TEXT NOT NULL,
  timestamp_query TIMESTAMP WITH TIME ZONE DEFAULT now(),
  search_results JSONB,
  clicked_url TEXT,
  clicked_rank INTEGER,
  scroll_depth INTEGER,
  query_duration_sec INTEGER,
  query_reformulation BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required for this research study)
CREATE POLICY "Allow all operations on user_sessions" 
ON public.user_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on queries" 
ON public.queries 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_queries_session_id ON public.queries(session_id);
CREATE INDEX IF NOT EXISTS idx_queries_timestamp ON public.queries(timestamp_query);