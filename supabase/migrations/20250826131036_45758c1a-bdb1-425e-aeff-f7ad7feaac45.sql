-- Security Fix Migration: Critical Database Issues
-- 1. Add missing 'browser' column to search_sessions table
ALTER TABLE public.search_sessions ADD COLUMN IF NOT EXISTS browser TEXT;

-- 2. Enable RLS on unprotected public tables
ALTER TABLE public.scroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_result_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timing ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for scroll_events table
CREATE POLICY "Allow public access to scroll_events" ON public.scroll_events FOR ALL USING (true);

-- 4. Create RLS policies for search_result_log table  
CREATE POLICY "Allow public access to search_result_log" ON public.search_result_log FOR ALL USING (true);

-- 5. Create RLS policies for session_timing table
CREATE POLICY "Allow public access to session_timing" ON public.session_timing FOR ALL USING (true);

-- 6. Fix database function security by adding search_path to critical functions
CREATE OR REPLACE FUNCTION public.bucket_task_duration(duration_seconds integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF duration_seconds < 60 THEN
        RETURN 'under_1_minute';
    ELSIF duration_seconds < 300 THEN
        RETURN '1_to_5_minutes';
    ELSIF duration_seconds < 600 THEN
        RETURN '5_to_10_minutes';
    ELSIF duration_seconds < 1200 THEN
        RETURN '10_to_20_minutes';
    ELSE
        RETURN 'over_20_minutes';
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_set_query_duration_sec()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.end_time is not null and new.start_time is not null) then
    new.query_duration_sec := greatest(0, extract(epoch from (new.end_time - new.start_time))::int);
  end if;
  return new;
end$function$;

CREATE OR REPLACE FUNCTION public.trg_set_session_duration_ms()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.session_end_time is not null and new.session_start_time is not null) then
    new.session_duration_ms := greatest(0, (extract(epoch from (new.session_end_time - new.session_start_time))*1000)::bigint);
  end if;
  return new;
end$function$;

CREATE OR REPLACE FUNCTION public.metric_click_grace_ms()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT 7000 $function$;

CREATE OR REPLACE FUNCTION public.trg_set_query_duration_ms()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.end_time is not null and new.start_time is not null) then
    new.query_duration_ms := greatest(0, (extract(epoch from (new.end_time - new.start_time))*1000)::bigint);
  end if;
  return new;
end$function$;