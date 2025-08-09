-- Check interactions table structure and permissions
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if interactions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'interactions';

-- Check recent interaction records
SELECT COUNT(*) as total_interactions FROM interactions;

-- Check recent experiment_queries records
SELECT COUNT(*) as total_queries FROM experiment_queries;

-- Show sample data
SELECT 
    i.id,
    i.query_id,
    i.clicked_url,
    i.clicked_rank,
    i.created_at,
    eq.query_text
FROM interactions i
LEFT JOIN experiment_queries eq ON i.query_id = eq.id
ORDER BY i.created_at DESC 
LIMIT 5;
