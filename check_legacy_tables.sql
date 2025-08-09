# Check for Legacy Tables
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_sessions', 'queries')
ORDER BY table_name;

-- Check if any data exists in legacy tables (if they exist)
SELECT 
  (SELECT COUNT(*) FROM user_sessions) as user_sessions_count,
  (SELECT COUNT(*) FROM queries) as queries_count;
