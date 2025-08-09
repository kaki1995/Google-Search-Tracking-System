-- Supabase Enhanced Tracking Migration Script
-- Creates all required tables for enhanced metrics tracking

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    platform TEXT,
    device_info JSONB,
    consent_given BOOLEAN,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    query_text TEXT,
    result_count INTEGER,
    reformulation_count INTEGER DEFAULT 0,
    query_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES experiment_queries(id),
    clicked_url TEXT,
    clicked_rank INTEGER,
    clicked_result_count INTEGER,
    interaction_type TEXT,
    element_id TEXT,
    element_text TEXT,
    page_coordinates TEXT,
    viewport_coordinates TEXT,
    interaction_metadata JSONB,
    session_time_ms INTEGER,
    interaction_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interaction_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES interactions(id),
    interaction_type TEXT,
    element_id TEXT,
    value TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS query_timing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES experiment_queries(id),
    time_to_first_result INTEGER,
    time_to_first_click_ms INTEGER,
    user_clicked BOOLEAN,
    user_scrolled BOOLEAN,
    search_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS background_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    survey_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_survey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    survey_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    survey_type TEXT,
    exit_reason TEXT,
    exit_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_timing_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    total_duration_ms INTEGER,
    first_interaction_time TIMESTAMP,
    last_interaction_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_query_id ON interactions(query_id);
CREATE INDEX IF NOT EXISTS idx_interaction_details_interaction_id ON interaction_details(interaction_id);
CREATE INDEX IF NOT EXISTS idx_query_timing_metrics_query_id ON query_timing_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_experiment_queries_session_id ON experiment_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_exits_session_id ON survey_exits(session_id);
CREATE INDEX IF NOT EXISTS idx_session_timing_summary_session_id ON session_timing_summary(session_id);
