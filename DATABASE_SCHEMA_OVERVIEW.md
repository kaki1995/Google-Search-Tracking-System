# Supabase Database Schema Overview
**Google Search Tracking System**

## 🏗️ Database Architecture

Your Supabase database is designed to track user behavior during a research study involving Google search interactions. Here's the complete schema breakdown:

---

## 📊 **Core Tables & Relationships**

### 🎯 **1. Sessions Table** (Main Hub)
```sql
sessions {
  id: UUID (PRIMARY KEY)
  user_id: TEXT (Required)
  platform: TEXT (Google|ChatGPT) 
  start_time: TIMESTAMP (Required)
  
  -- User Environment
  browser: TEXT
  device_type: TEXT
  location: TEXT
  user_agent: TEXT
  screen_resolution: TEXT
  timezone: TEXT
  
  -- Session Tracking
  current_query_id: UUID → experiment_queries(id)
  search_phase: ENUM (pre_search|search_active|results_viewing|post_search)
  session_duration: INTEGER
  time_to_first_query: INTEGER
  total_queries: INTEGER
  welcome_page_action: TEXT
  
  -- Metadata
  budget_range: TEXT
  session_metadata: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```
**Purpose**: Central hub tracking user sessions and basic metadata

---

### 🔍 **2. Experiment Queries Table** (Search Behavior)
```sql
experiment_queries {
  id: UUID (PRIMARY KEY)
  session_id: UUID → sessions(id) (Required)
  query_text: TEXT (Required)
  
  -- Query Characteristics
  structure_type: TEXT
  complexity: INTEGER
  reformulation_count: INTEGER
  query_order: INTEGER
  previous_query_id: UUID → experiment_queries(id)
  
  -- Timing Data
  timestamp: TIMESTAMP
  query_start_time: TIMESTAMP
  first_result_load_time: TIMESTAMP
  last_interaction_time: TIMESTAMP
  time_per_query: INTEGER
  
  -- Results Tracking
  results_count: INTEGER
  results_loaded_count: INTEGER
  query_metadata: JSONB
  
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```
**Purpose**: Tracks every search query and its characteristics

---

### 🖱️ **3. Interactions Table** (User Actions)
```sql
interactions {
  id: UUID (PRIMARY KEY)
  query_id: UUID → experiment_queries(id) (Required)
  
  -- Interaction Details
  interaction_type: ENUM (click|scroll|hover|focus|keypress|page_view)
  interaction_time: TIMESTAMP
  
  -- Click Tracking
  clicked_url: TEXT
  clicked_rank: INTEGER
  clicked_result_count: INTEGER
  
  -- Element Tracking
  element_id: TEXT
  element_text: TEXT
  element_visibility: BOOLEAN
  
  -- Positioning
  page_coordinates: POINT
  viewport_coordinates: POINT
  scroll_depth: INTEGER
  
  -- Timing
  session_time_ms: INTEGER
  query_time_ms: INTEGER
  hover_duration_ms: INTEGER
  
  -- Behavior
  follow_up_prompt: BOOLEAN
  interaction_metadata: JSONB
  
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```
**Purpose**: Captures detailed user interactions with search results

---

### 🔍 **4. Interaction Details Table** (Granular Actions)
```sql
interaction_details {
  id: UUID (PRIMARY KEY)
  interaction_id: UUID → interactions(id) (Required)
  
  interaction_type: ENUM (click|scroll|hover|focus|keypress|page_view)
  element_id: TEXT
  value: TEXT
  metadata: JSONB
  
  created_at: TIMESTAMP
}
```
**Purpose**: Stores granular details about specific interactions

---

### 📝 **5. Background Surveys Table** (User Demographics)
```sql
background_surveys {
  id: UUID (PRIMARY KEY)
  session_id: UUID → sessions(id) (Required)
  
  -- Demographics
  age_group: TEXT
  gender: TEXT
  education: TEXT
  country: TEXT
  native_language: TEXT
  
  -- Experience Ratings (1-7 scale)
  shopping_experience: INTEGER
  product_research_familiarity: INTEGER
  google_search_frequency: TEXT
  
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```
**Purpose**: Collects user demographic and experience data

---

### 📊 **6. Post Survey Table** (Study Feedback)
```sql
post_survey {
  id: UUID (PRIMARY KEY)
  session_id: UUID → sessions(id) (Required)
  
  -- Google Search Experience (1-7 scale)
  google_ease: INTEGER
  google_relevance: INTEGER
  google_satisfaction: INTEGER
  google_trust: INTEGER
  
  -- Study Feedback
  search_tool_type: TEXT
  task_duration: TEXT
  attention_check: INTEGER
  google_query_modifications: TEXT
  google_open_feedback: TEXT
  
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```
**Purpose**: Captures post-study feedback and ratings

---

### 🚪 **7. Survey Exits Table** (Exit Tracking) *New!*
```sql
survey_exits {
  id: UUID (PRIMARY KEY)
  session_id: UUID → sessions(id) (CASCADE DELETE)
  
  -- Exit Details
  survey_type: TEXT (background|post_task|general) (Required)
  exit_time: TIMESTAMP (Required)
  exit_reason: TEXT (user_clicked_exit_study, browser_close, etc.)
  
  -- Progress Tracking
  time_spent_ms: INTEGER
  questions_answered: INTEGER (DEFAULT 0)
  form_data: JSONB (partial form data at exit)
  
  -- Context
  page_url: TEXT
  user_agent: TEXT
  
  created_at: TIMESTAMP
}
```
**Purpose**: Tracks when and why users exit surveys

---

## ⏱️ **Performance & Analytics Tables**

### 📈 **8. Query Timing Metrics Table**
```sql
query_timing_metrics {
  id: UUID (PRIMARY KEY)
  query_id: UUID → experiment_queries(id) (Required)
  
  -- Timing Measurements
  search_duration_ms: INTEGER
  time_to_first_result: INTEGER
  time_to_first_click_ms: INTEGER
  query_end_time: TIMESTAMP
  
  -- Behavior Flags
  user_clicked: BOOLEAN
  user_scrolled: BOOLEAN
  query_abandoned: BOOLEAN
  results_loaded_count: INTEGER
  
  created_at: TIMESTAMP
}
```

### 📊 **9. Session Timing Summary Table**
```sql
session_timing_summary {
  id: UUID (PRIMARY KEY)
  session_id: UUID → sessions(id) (ONE-TO-ONE)
  
  -- Aggregate Metrics
  total_session_duration_ms: INTEGER
  total_searches: INTEGER
  total_clicks: INTEGER
  successful_queries: INTEGER
  
  -- Calculated Averages
  avg_time_per_query: FLOAT
  avg_time_to_click: FLOAT
  clicks_per_query: FLOAT
  queries_per_minute: FLOAT
  min_max_time_per_query: TEXT
  
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

---

## 🔄 **Legacy/Alternative Tables**

### 📋 **10. User Sessions Table** (Alternative Structure)
```sql
user_sessions {
  session_id: TEXT (PRIMARY KEY)
  user_id: TEXT (Required)
  
  -- Study Progress
  consent_given: BOOLEAN
  consent_timestamp: TIMESTAMP
  completed: BOOLEAN
  exited_early: BOOLEAN
  
  -- Data Storage
  background_survey: JSONB
  search_experience_log_1: JSONB
  search_experience_log_2: JSONB
  
  -- Final Results
  final_choice_url: TEXT
  decision_confidence: INTEGER
  device_type: TEXT
  
  created_at: TIMESTAMP
}
```

### 🔍 **11. Queries Table** (Legacy Query Tracking)
```sql
queries {
  query_id: TEXT (PRIMARY KEY)
  session_id: TEXT → user_sessions(session_id)
  query_text: TEXT (Required)
  
  -- Simple Tracking
  timestamp_query: TIMESTAMP
  query_duration_sec: INTEGER
  query_reformulation: BOOLEAN
  
  -- Results
  search_results: JSONB
  clicked_url: TEXT
  clicked_rank: INTEGER
  scroll_depth: INTEGER
}
```

---

## 🔗 **Key Relationships**

### **Primary Data Flow**:
```
sessions (1) → (many) experiment_queries
experiment_queries (1) → (many) interactions  
interactions (1) → (many) interaction_details

sessions (1) → (1) background_surveys
sessions (1) → (1) post_survey
sessions (1) → (many) survey_exits
sessions (1) → (1) session_timing_summary
```

### **Performance Tracking**:
```
experiment_queries (1) → (1) query_timing_metrics
sessions → session_timing_summary (aggregated data)
```

---

## 🔒 **Security & Functions**

### **Row Level Security (RLS)**:
- All tables have RLS enabled
- Public access policies for research experiment
- Session-based data isolation

### **Database Functions**:
- `create_enhanced_session()` - Creates session with metadata
- `log_enhanced_query()` - Logs query with timing
- `log_enhanced_interaction()` - Records user interactions
- `validate_session_access()` - Session validation
- `update_session_survey_status()` - Survey exit trigger function

### **Enums**:
- `interaction_type`: click, scroll, hover, focus, keypress, page_view
- `search_phase`: pre_search, search_active, results_viewing, post_search

---

## 🎯 **Research Study Flow**

1. **Session Start** → `sessions` table
2. **Background Survey** → `background_surveys` table  
3. **Search Queries** → `experiment_queries` table
4. **User Interactions** → `interactions` + `interaction_details` tables
5. **Performance Metrics** → `query_timing_metrics` + `session_timing_summary`
6. **Survey Exits** → `survey_exits` table (*New Feature*)
7. **Post-Study Survey** → `post_survey` table
8. **Session Complete** → Update `sessions` table

This schema provides comprehensive tracking of user behavior, search patterns, interaction details, and study completion metrics for research analysis.
