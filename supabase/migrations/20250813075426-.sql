-- Add ip_address and device_type to survey and telemetry tables
ALTER TABLE IF EXISTS public.background_survey
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.post_task_survey
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.consent_logs
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.task_instruction
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.search_sessions
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.queries
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.query_clicks
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;

ALTER TABLE IF EXISTS public.scroll_events
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS device_type text;