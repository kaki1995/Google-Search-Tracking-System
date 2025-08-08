-- Fix the remaining function search path security warning
ALTER FUNCTION public.validate_session_access(uuid) SET search_path = 'public';