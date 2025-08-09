-- ============ Enhanced SERP Experiment Tracking Schema ============
-- This migration creates a comprehensive tracking system for one-page SERP experiments

-- ============ 1) ENUMS ============
CREATE TYPE public.tool_type AS ENUM ('google_links','chatgpt_chat');
CREATE TYPE public.interaction_kind AS ENUM (
  'submit_query','results_rendered','result_click','manual_url',
  'scroll','hover','follow_up_prompt','finish_task'
);

-- ============ 2) ADD NEW COLUMNS TO EXISTING TABLES ============

-- Enhance sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS session_start_time timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS tool_type tool_type DEFAULT 'google_links',
ADD COLUMN IF NOT EXISTS session_duration_ms integer,
ADD COLUMN IF NOT EXISTS time_to_first_query_ms integer;

-- Enhance experiment_queries table  
ALTER TABLE public.experiment_queries
ADD COLUMN IF NOT EXISTS query_start_time timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS query_end_time timestamptz,
ADD COLUMN IF NOT EXISTS query_abandoned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS query_complexity_score integer,
ADD COLUMN IF NOT EXISTS results_loaded_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_per_query_ms integer;

-- Enhance interactions table
ALTER TABLE public.interactions
ADD COLUMN IF NOT EXISTS interaction_type interaction_kind DEFAULT 'result_click',
ADD COLUMN IF NOT EXISTS result_position integer,
ADD COLUMN IF NOT EXISTS scroll_position integer,
ADD COLUMN IF NOT EXISTS page_scroll_y integer,
ADD COLUMN IF NOT EXISTS viewport_height integer,
ADD COLUMN IF NOT EXISTS time_to_first_click_ms integer,
ADD COLUMN IF NOT EXISTS time_to_first_interaction_ms integer,
ADD COLUMN IF NOT EXISTS time_to_first_result_ms integer,
ADD COLUMN IF NOT EXISTS user_clicked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS user_scrolled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS clicked_domain text;

-- ============ 3) CREATE NEW TABLES ============

-- Query timing metrics for detailed performance tracking
CREATE TABLE IF NOT EXISTS public.query_timing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
  search_duration_ms integer,
  time_to_first_result_ms integer,
  time_to_first_click_ms integer,
  time_to_first_interaction_ms integer,
  user_clicked boolean DEFAULT false,
  user_scrolled boolean DEFAULT false,
  results_loaded_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Session timing summary for aggregated metrics
CREATE TABLE IF NOT EXISTS public.session_timing_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  total_session_duration_ms integer,
  total_searches integer DEFAULT 0,
  successful_queries integer DEFAULT 0,
  avg_time_per_query integer DEFAULT 0,
  min_max_time_per_query text,
  total_clicks integer DEFAULT 0,
  avg_time_to_click integer DEFAULT 0,
  clicks_per_query numeric(10,2) DEFAULT 0,
  queries_per_minute numeric(10,2) DEFAULT 0,
  total_scroll_events integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ 4) INDEXES FOR PERFORMANCE ============
CREATE INDEX IF NOT EXISTS idx_sessions_user_tool ON public.sessions(user_id, tool_type);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(session_start_time);
CREATE INDEX IF NOT EXISTS idx_queries_session_order ON public.experiment_queries(session_id, query_order);
CREATE INDEX IF NOT EXISTS idx_queries_start_time ON public.experiment_queries(query_start_time);
CREATE INDEX IF NOT EXISTS idx_interactions_query_type ON public.interactions(query_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_time ON public.interactions(interaction_time);
CREATE INDEX IF NOT EXISTS idx_query_timing_metrics_query ON public.query_timing_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_session_timing_summary_session ON public.session_timing_summary(session_id);

-- ============ 5) METRIC COMPUTATION FUNCTIONS ============

-- Constants for heuristics
CREATE OR REPLACE FUNCTION public.metric_idle_timeout_ms() 
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 90000 $$; -- 90 seconds

CREATE OR REPLACE FUNCTION public.metric_click_grace_ms() 
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 7000 $$; -- 7 seconds

-- ============ 6) COMPUTED VIEWS ============

-- First interaction per query
CREATE OR REPLACE VIEW public.v_first_interaction AS
SELECT
  q.id as query_id,
  MIN(i.interaction_time) as first_interaction_time
FROM public.experiment_queries q
LEFT JOIN public.interactions i ON i.query_id = q.id
  AND i.interaction_type IN ('result_click','manual_url','scroll','hover','follow_up_prompt')
GROUP BY q.id;

-- First click per query  
CREATE OR REPLACE VIEW public.v_first_click AS
SELECT
  q.id as query_id,
  MIN(i.interaction_time) as first_click_time
FROM public.experiment_queries q
LEFT JOIN public.interactions i ON i.query_id = q.id
  AND i.interaction_type IN ('result_click','manual_url')
GROUP BY q.id;

-- Results rendered timing
CREATE OR REPLACE VIEW public.v_results_rendered AS
SELECT
  q.id as query_id,
  MIN(i.interaction_time) as results_rendered_time,
  MAX(COALESCE(i.result_rank, i.result_position, 0)) as max_result_rank
FROM public.experiment_queries q
LEFT JOIN public.interactions i ON i.query_id = q.id
  AND i.interaction_type = 'results_rendered'
GROUP BY q.id;

-- Query end time heuristics
CREATE OR REPLACE VIEW public.v_query_end AS
WITH next_q AS (
  SELECT q1.id as query_id, MIN(q2.query_start_time) as next_query_start
  FROM public.experiment_queries q1
  LEFT JOIN public.experiment_queries q2 ON q2.session_id = q1.session_id AND q2.query_order = q1.query_order + 1
  GROUP BY q1.id
),
finish AS (
  SELECT query_id, MIN(interaction_time) as finish_time
  FROM public.interactions
  WHERE interaction_type = 'finish_task'
  GROUP BY query_id
),
first_sel AS (
  SELECT query_id, MIN(interaction_time) as first_select_time
  FROM public.interactions
  WHERE interaction_type IN ('result_click','manual_url')
  GROUP BY query_id
),
last_evt AS (
  SELECT query_id, MAX(interaction_time) as last_event_time
  FROM public.interactions
  GROUP BY query_id
)
SELECT
  q.id as query_id,
  COALESCE(
    n.next_query_start,
    f.finish_time,
    (fs.first_select_time + INTERVAL '7 seconds'),
    (le.last_event_time + INTERVAL '90 seconds')
  ) as computed_query_end
FROM public.experiment_queries q
LEFT JOIN next_q n ON n.query_id = q.id
LEFT JOIN finish f ON f.query_id = q.id
LEFT JOIN first_sel fs ON fs.query_id = q.id
LEFT JOIN last_evt le ON le.query_id = q.id;

-- Enhanced query metrics view
CREATE OR REPLACE VIEW public.v_enhanced_query_metrics AS
SELECT
  q.id,
  q.session_id,
  q.query_order,
  q.previous_query_id,
  q.query_start_time,
  qe.computed_query_end as query_end_time,
  q.structure_type as query_structure_type,
  q.complexity as query_complexity_score,
  COALESCE(q.results_loaded_count, rr.max_result_rank, 0) as results_loaded_count,
  EXTRACT(EPOCH FROM (qe.computed_query_end - q.query_start_time)) * 1000 as time_per_query,
  EXTRACT(EPOCH FROM (fc.first_click_time - q.query_start_time)) * 1000 as time_to_first_click,
  EXTRACT(EPOCH FROM (fi.first_interaction_time - q.query_start_time)) * 1000 as time_to_first_interaction,
  EXTRACT(EPOCH FROM (rr.results_rendered_time - q.query_start_time)) * 1000 as time_to_first_result,
  (fc.first_click_time IS NOT NULL) as user_clicked,
  EXISTS(
    SELECT 1 FROM public.interactions ix
    WHERE ix.query_id = q.id AND ix.interaction_type = 'scroll'
  ) as user_scrolled,
  CASE WHEN fc.first_click_time IS NULL AND qe.computed_query_end IS NOT NULL
       THEN true ELSE false END as query_abandoned
FROM public.experiment_queries q
LEFT JOIN public.v_first_click fc ON fc.query_id = q.id
LEFT JOIN public.v_first_interaction fi ON fi.query_id = q.id
LEFT JOIN public.v_results_rendered rr ON rr.query_id = q.id
LEFT JOIN public.v_query_end qe ON qe.query_id = q.id;

-- Enhanced session metrics view
CREATE OR REPLACE VIEW public.v_enhanced_session_metrics AS
WITH perq AS (
  SELECT * FROM public.v_enhanced_query_metrics
),
clicks AS (
  SELECT q.session_id, COUNT(*) as total_clicks
  FROM public.interactions i
  JOIN public.experiment_queries q ON q.id = i.query_id
  WHERE i.interaction_type IN ('result_click','manual_url')
  GROUP BY q.session_id
),
scrolls AS (
  SELECT q.session_id, COUNT(*) as total_scroll_events
  FROM public.interactions i
  JOIN public.experiment_queries q ON q.id = i.query_id
  WHERE i.interaction_type = 'scroll'
  GROUP BY q.session_id
),
first_last AS (
  SELECT
    s.id as session_id,
    MIN(q.query_start_time) as first_query_time,
    MAX(p.query_end_time) as last_query_end
  FROM public.sessions s
  LEFT JOIN public.experiment_queries q ON q.session_id = s.id
  LEFT JOIN perq p ON p.id = q.id
  GROUP BY s.id
)
SELECT
  s.id as session_id,
  COALESCE(s.session_start_time, s.start_time) as session_start_time,
  EXTRACT(EPOCH FROM (fl.first_query_time - COALESCE(s.session_start_time, s.start_time))) * 1000 as time_to_first_query,
  COUNT(q.id) as total_queries_executed,
  COALESCE(c.total_clicks, 0) as total_clicks,
  COALESCE(sc.total_scroll_events, 0) as total_scroll_events,
  COALESCE(AVG(p.time_per_query), 0) as avg_time_per_query,
  COALESCE(AVG(p.time_to_first_click), 0) as avg_time_to_click,
  COALESCE(MIN(p.time_per_query), 0) as min_time_per_query,
  COALESCE(MAX(p.time_per_query), 0) as max_time_per_query,
  COALESCE(SUM(CASE WHEN p.user_clicked THEN 1 ELSE 0 END), 0) as successful_queries,
  COALESCE(EXTRACT(EPOCH FROM (fl.last_query_end - COALESCE(s.session_start_time, s.start_time))) * 1000, s.session_duration) as total_session_duration,
  CASE
    WHEN fl.last_query_end IS NOT NULL
      THEN (COUNT(q.id) / GREATEST(EXTRACT(EPOCH FROM (fl.last_query_end - COALESCE(s.session_start_time, s.start_time)))/60.0, 0.01))
    ELSE NULL
  END as queries_per_minute,
  CASE 
    WHEN COUNT(q.id) > 0 THEN COALESCE(c.total_clicks, 0)::numeric / COUNT(q.id)
    ELSE 0
  END as clicks_per_query
FROM public.sessions s
LEFT JOIN public.experiment_queries q ON q.session_id = s.id
LEFT JOIN perq p ON p.id = q.id
LEFT JOIN clicks c ON c.session_id = s.id
LEFT JOIN scrolls sc ON sc.session_id = s.id
LEFT JOIN first_last fl ON fl.session_id = s.id
GROUP BY s.id, s.session_start_time, s.start_time, fl.first_query_time, fl.last_query_end, c.total_clicks, sc.total_scroll_events, s.session_duration;

-- ============ 7) RLS POLICIES ============
ALTER TABLE public.query_timing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timing_summary ENABLE ROW LEVEL SECURITY;

-- Allow public access for anonymous experiments (adjust as needed)
CREATE POLICY "Allow public access to query timing metrics" ON public.query_timing_metrics
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to session timing summary" ON public.session_timing_summary  
FOR ALL USING (true) WITH CHECK (true);

-- ============ 8) RPC HELPER FUNCTIONS ============

-- Enhanced session creation
CREATE OR REPLACE FUNCTION public.create_enhanced_session(
  p_user_id text,
  p_platform text DEFAULT 'google_links',
  p_device_type text DEFAULT 'desktop',
  p_browser text DEFAULT 'unknown',
  p_location text DEFAULT 'unknown'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  session_uuid uuid;
BEGIN
  INSERT INTO public.sessions (
    user_id, platform, device_type, browser, location, session_start_time
  ) VALUES (
    p_user_id, p_platform::tool_type, p_device_type, p_browser, p_location, now()
  ) RETURNING id INTO session_uuid;
  
  RETURN session_uuid;
END;
$$;

-- Enhanced query logging
CREATE OR REPLACE FUNCTION public.log_enhanced_query(
  p_session_id uuid,
  p_query_text text,
  p_query_order integer,
  p_previous_query_id uuid DEFAULT NULL,
  p_structure_type text DEFAULT NULL,
  p_complexity integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  query_uuid uuid;
BEGIN
  INSERT INTO public.experiment_queries (
    session_id, query_text, query_order, previous_query_id, 
    structure_type, complexity, query_start_time
  ) VALUES (
    p_session_id, p_query_text, p_query_order, p_previous_query_id,
    p_structure_type, p_complexity, now()
  ) RETURNING id INTO query_uuid;
  
  RETURN query_uuid;
END;
$$;

-- Enhanced interaction logging
CREATE OR REPLACE FUNCTION public.log_enhanced_interaction(
  p_query_id uuid,
  p_interaction_type text,
  p_clicked_rank integer DEFAULT NULL,
  p_clicked_url text DEFAULT NULL,
  p_scroll_position integer DEFAULT NULL,
  p_page_scroll_y integer DEFAULT NULL,
  p_viewport_height integer DEFAULT NULL,
  p_follow_up_prompt text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  interaction_uuid uuid;
  domain_name text;
BEGIN
  -- Extract domain from URL
  IF p_clicked_url IS NOT NULL THEN
    domain_name := regexp_replace(p_clicked_url, '^https?://([^/]+).*', '\1');
  END IF;
  
  INSERT INTO public.interactions (
    query_id, interaction_type, clicked_rank, clicked_url, clicked_domain,
    scroll_position, page_scroll_y, viewport_height, follow_up_prompt,
    interaction_time
  ) VALUES (
    p_query_id, p_interaction_type::interaction_kind, p_clicked_rank, p_clicked_url, domain_name,
    p_scroll_position, p_page_scroll_y, p_viewport_height, p_follow_up_prompt,
    now()
  ) RETURNING id INTO interaction_uuid;
  
  RETURN interaction_uuid;
END;
$$;

-- Update query timing metrics
CREATE OR REPLACE FUNCTION public.update_query_metrics(p_query_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  query_metrics RECORD;
BEGIN
  SELECT * INTO query_metrics FROM public.v_enhanced_query_metrics WHERE id = p_query_id;
  
  IF query_metrics.id IS NOT NULL THEN
    INSERT INTO public.query_timing_metrics (
      query_id, search_duration_ms, time_to_first_result_ms,
      time_to_first_click_ms, time_to_first_interaction_ms,
      user_clicked, user_scrolled, results_loaded_count
    ) VALUES (
      p_query_id, query_metrics.time_per_query, query_metrics.time_to_first_result,
      query_metrics.time_to_first_click, query_metrics.time_to_first_interaction,
      query_metrics.user_clicked, query_metrics.user_scrolled, query_metrics.results_loaded_count
    ) ON CONFLICT (query_id) DO UPDATE SET
      search_duration_ms = EXCLUDED.search_duration_ms,
      time_to_first_result_ms = EXCLUDED.time_to_first_result_ms,
      time_to_first_click_ms = EXCLUDED.time_to_first_click_ms,
      time_to_first_interaction_ms = EXCLUDED.time_to_first_interaction_ms,
      user_clicked = EXCLUDED.user_clicked,
      user_scrolled = EXCLUDED.user_scrolled,
      results_loaded_count = EXCLUDED.results_loaded_count,
      updated_at = now();
  END IF;
END;
$$;