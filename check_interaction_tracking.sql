-- Query to check interaction tracking data

-- Check latest interactions
SELECT 
    i.*,
    eq.query_text,
    s.user_id
FROM interactions i
LEFT JOIN experiment_queries eq ON i.query_id = eq.id
LEFT JOIN sessions s ON eq.session_id = s.id
ORDER BY i.created_at DESC
LIMIT 10;

-- Check latest interaction details
SELECT 
    id.*,
    i.interaction_type as parent_interaction_type,
    i.clicked_url
FROM interaction_details id
LEFT JOIN interactions i ON id.interaction_id = i.id
ORDER BY id.created_at DESC
LIMIT 10;

-- Check counts by interaction type
SELECT 
    interaction_type,
    COUNT(*) as count
FROM interactions
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY interaction_type
ORDER BY count DESC;

-- Check interaction details counts
SELECT 
    interaction_type,
    COUNT(*) as count
FROM interaction_details
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY interaction_type
ORDER BY count DESC;
