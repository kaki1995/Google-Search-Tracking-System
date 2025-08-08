-- Fix function search path security warnings
ALTER FUNCTION public.update_session_timing_summary() SET search_path = 'public';
ALTER FUNCTION public.create_interaction_details() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';