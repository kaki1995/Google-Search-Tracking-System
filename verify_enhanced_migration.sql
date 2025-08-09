-- Verify Enhanced Tracking Service Database Integration
-- Check if all enhanced tables and methods are working with Supabase remote

-- 1. Check if enhanced tables exist
SELECT 
    table_name,
    table_schema,
    CASE 
        WHEN table_name IN ('query_timing_metrics', 'interaction_details') THEN 'Enhanced Table'
        WHEN table_name IN ('sessions', 'experiment_queries', 'interactions', 'background_surveys', 'post_survey', 'survey_exits') THEN 'Core Table'
        ELSE 'Other'
    END as table_category
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'sessions',
    'experiment_queries', 
    'interactions',
    'interaction_details',
    'query_timing_metrics',
    'background_surveys',
    'post_survey', 
    'survey_exits',
    'session_timing_summary'
)
ORDER BY table_category, table_name;

-- 2. Check if enhanced tables have data (recent entries)
SELECT 
    'query_timing_metrics' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as recent_records
FROM query_timing_metrics
UNION ALL
SELECT 
    'interaction_details' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as recent_records
FROM interaction_details
UNION ALL
SELECT 
    'survey_exits' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as recent_records
FROM survey_exits;

-- 3. Check relationships between enhanced tables
SELECT 
    qm.id as timing_metric_id,
    eq.query_text,
    qm.search_duration_ms,
    qm.user_clicked,
    qm.user_scrolled,
    qm.created_at
FROM query_timing_metrics qm
JOIN experiment_queries eq ON qm.query_id = eq.id
ORDER BY qm.created_at DESC
LIMIT 5;

-- 4. Check interaction details with their parent interactions
SELECT 
    id.id as detail_id,
    i.clicked_url,
    id.interaction_type,
    id.element_id,
    id.value,
    id.created_at
FROM interaction_details id
JOIN interactions i ON id.interaction_id = i.id
ORDER BY id.created_at DESC
LIMIT 5;

-- 5. Verify survey exits functionality
SELECT 
    se.id,
    se.survey_type,
    se.exit_reason,
    se.exit_time,
    s.user_id,
    s.platform
FROM survey_exits se
JOIN sessions s ON se.session_id = s.id
ORDER BY se.created_at DESC
LIMIT 5;
