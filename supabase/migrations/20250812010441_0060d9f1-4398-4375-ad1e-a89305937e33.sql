-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Participants table
CREATE TABLE IF NOT EXISTS public.participants (
  participant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  device_type text
);

-- 2) Background survey (participant-level)
CREATE TABLE IF NOT EXISTS public.background_survey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(participant_id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Task instruction (Q10 response)
CREATE TABLE IF NOT EXISTS public.task_instruction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(participant_id) ON DELETE CASCADE,
  q10_response text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- 4) Search sessions (one row per participant's task)
CREATE TABLE IF NOT EXISTS public.search_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(participant_id) ON DELETE CASCADE,
  session_start_time timestamptz,
  session_end_time timestamptz,
  query_count int,
  query_reformulation_count int,
  total_clicked_results_count int,
  scroll_depth_max int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Queries (details of each query attempt)
CREATE TABLE IF NOT EXISTS public.queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
  query_order int,
  query_text text,
  query_structure text,
  start_time timestamptz,
  end_time timestamptz,
  query_duration_sec int,
  click_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Query clicks (click tracking per query)
CREATE TABLE IF NOT EXISTS public.query_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
  click_order int,
  click_time timestamptz,
  clicked_rank int,
  clicked_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7) Scroll events (optional – per query)
CREATE TABLE IF NOT EXISTS public.scroll_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
  scroll_depth_percent int CHECK (scroll_depth_percent BETWEEN 0 AND 100),
  timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8) Post task survey (participant-level)
CREATE TABLE IF NOT EXISTS public.post_task_survey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(participant_id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Basic helpful indexes
CREATE INDEX IF NOT EXISTS idx_background_survey_participant ON public.background_survey(participant_id);
CREATE INDEX IF NOT EXISTS idx_task_instruction_participant ON public.task_instruction(participant_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_participant ON public.search_sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_queries_session ON public.queries(session_id);
CREATE INDEX IF NOT EXISTS idx_query_clicks_query ON public.query_clicks(query_id);
CREATE INDEX IF NOT EXISTS idx_scroll_events_query ON public.scroll_events(query_id);

-- Enable Row Level Security for all tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instruction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_task_survey ENABLE ROW LEVEL SECURITY;

-- Security policies
-- No reads from frontend (no SELECT policies). Service role bypasses RLS for admin/export.

-- Allow INSERT only if participant exists. These are defensive policies in case someone bypasses Edge Functions.
CREATE POLICY IF NOT EXISTS "allow_insert_participants" ON public.participants
  FOR INSERT TO anon, authenticated
  WITH CHECK (true); -- Creating a participant is allowed (no PII collected)

CREATE POLICY IF NOT EXISTS "allow_insert_background_survey_with_valid_participant" ON public.background_survey
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.participants p WHERE p.participant_id = background_survey.participant_id
  ));

CREATE POLICY IF NOT EXISTS "allow_insert_task_instruction_with_valid_participant" ON public.task_instruction
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.participants p WHERE p.participant_id = task_instruction.participant_id
  ));

CREATE POLICY IF NOT EXISTS "allow_insert_search_sessions_with_valid_participant" ON public.search_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.participants p WHERE p.participant_id = search_sessions.participant_id
  ));

-- For queries and child tables, allow insert if their parents exist
CREATE POLICY IF NOT EXISTS "allow_insert_queries_if_parent_session_exists" ON public.queries
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.search_sessions s WHERE s.id = queries.session_id
  ));

CREATE POLICY IF NOT EXISTS "allow_insert_query_clicks_if_parent_query_exists" ON public.query_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.queries q WHERE q.id = query_clicks.query_id
  ));

CREATE POLICY IF NOT EXISTS "allow_insert_scroll_events_if_parent_query_exists" ON public.scroll_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.queries q WHERE q.id = scroll_events.query_id
  ));

CREATE POLICY IF NOT EXISTS "allow_insert_post_task_survey_with_valid_participant" ON public.post_task_survey
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.participants p WHERE p.participant_id = post_task_survey.participant_id
  ));
