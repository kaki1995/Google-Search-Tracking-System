-- Remove Legacy Tables - Safe Cleanup
-- Run this script to remove unused legacy tables from your database

-- Drop legacy tables (they contain no data and are not used by the application)
DROP TABLE IF EXISTS queries CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Verify cleanup - this should return no rows after running the above
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_sessions', 'queries');
