-- Security Fix Migration Part 2: Fix remaining database functions with search_path
-- Update all remaining functions to include SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
    RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_session_survey_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Update the corresponding session status when a survey exit is recorded
    IF NEW.survey_type = 'background' THEN
        UPDATE public.sessions 
        SET 
            background_survey_status = 'exited',
            background_survey_exit_time = NEW.exit_time,
            background_survey_exit_reason = NEW.exit_reason
        WHERE id = NEW.session_id;
    ELSIF NEW.survey_type = 'post_task' THEN
        UPDATE public.sessions 
        SET 
            post_survey_status = 'exited',
            post_survey_exit_time = NEW.exit_time,
            post_survey_exit_reason = NEW.exit_reason
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.metric_idle_timeout_ms()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT 90000 $function$;

CREATE OR REPLACE FUNCTION public.update_query_metrics(p_query_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_enhanced_session(p_user_id text, p_platform text DEFAULT 'google_links'::text, p_device_type text DEFAULT 'desktop'::text, p_browser text DEFAULT 'unknown'::text, p_location text DEFAULT 'unknown'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;