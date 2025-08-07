-- Create sessions table
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('Google', 'ChatGPT')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    budget_range TEXT,
    device_type TEXT,
    browser TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create background_surveys table
CREATE TABLE public.background_surveys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    age_group TEXT,
    gender TEXT,
    education TEXT,
    country TEXT,
    native_language TEXT,
    shopping_experience INTEGER CHECK (shopping_experience >= 1 AND shopping_experience <= 7),
    product_research_familiarity INTEGER CHECK (product_research_familiarity >= 1 AND product_research_familiarity <= 7),
    google_search_frequency TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queries table (new schema)
CREATE TABLE public.experiment_queries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    structure_type TEXT,
    complexity INTEGER,
    reformulation_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interactions table
CREATE TABLE public.interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id UUID NOT NULL REFERENCES public.experiment_queries(id) ON DELETE CASCADE,
    clicked_result_count INTEGER,
    clicked_rank INTEGER,
    clicked_url TEXT,
    scroll_depth INTEGER CHECK (scroll_depth >= 0 AND scroll_depth <= 100),
    follow_up_prompt BOOLEAN DEFAULT false,
    interaction_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_survey table
CREATE TABLE public.post_survey (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    smartphone_model TEXT,
    price_range TEXT,
    purchase_platform TEXT,
    purchase_likelihood TEXT,
    decision_factors TEXT,
    interface_familiarity INTEGER CHECK (interface_familiarity >= 1 AND interface_familiarity <= 7),
    interface_confidence INTEGER CHECK (interface_confidence >= 1 AND interface_confidence <= 7),
    search_satisfaction INTEGER CHECK (search_satisfaction >= 1 AND search_satisfaction <= 7),
    information_efficiency INTEGER CHECK (information_efficiency >= 1 AND information_efficiency <= 7),
    interface_ease_of_use INTEGER CHECK (interface_ease_of_use >= 1 AND interface_ease_of_use <= 7),
    interface_usefulness INTEGER CHECK (interface_usefulness >= 1 AND interface_usefulness <= 7),
    decision_support INTEGER CHECK (decision_support >= 1 AND decision_support <= 7),
    interface_learnability INTEGER CHECK (interface_learnability >= 1 AND interface_learnability <= 7),
    interface_reuse_likelihood INTEGER CHECK (interface_reuse_likelihood >= 1 AND interface_reuse_likelihood <= 7),
    search_enjoyment TEXT,
    interface_comparison_rating TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create universal timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER set_updated_at_sessions
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_background_surveys
    BEFORE UPDATE ON public.background_surveys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_experiment_queries
    BEFORE UPDATE ON public.experiment_queries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_interactions
    BEFORE UPDATE ON public.interactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_post_survey
    BEFORE UPDATE ON public.post_survey
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_survey ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow public access for research experiment
CREATE POLICY "Allow public access to sessions" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Allow public access to background_surveys" ON public.background_surveys FOR ALL USING (true);
CREATE POLICY "Allow public access to experiment_queries" ON public.experiment_queries FOR ALL USING (true);
CREATE POLICY "Allow public access to interactions" ON public.interactions FOR ALL USING (true);
CREATE POLICY "Allow public access to post_survey" ON public.post_survey FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_platform ON public.sessions(platform);
CREATE INDEX idx_background_surveys_session_id ON public.background_surveys(session_id);
CREATE INDEX idx_experiment_queries_session_id ON public.experiment_queries(session_id);
CREATE INDEX idx_interactions_query_id ON public.interactions(query_id);
CREATE INDEX idx_post_survey_session_id ON public.post_survey(session_id);