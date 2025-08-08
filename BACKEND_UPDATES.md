# Backend Updates for PostTaskSurvey Changes

## Overview
Updated the backend to align with the new Google-focused PostTaskSurvey questions implemented in the frontend.

## Changes Made

### 1. Database Schema Migration
- **File**: `supabase/migrations/20250808150000_update_post_survey_google_focus.sql`
- **Purpose**: Update post_survey table structure to match new frontend form fields

#### New Schema Fields:
- `google_satisfaction` (INTEGER 1-7): Q16 - Google search satisfaction
- `google_ease` (INTEGER 1-7): Q17 - Google interface ease of use  
- `google_relevance` (INTEGER 1-7): Q18 - Google search results relevance
- `google_trust` (INTEGER 1-7): Q19 - Trust in Google search results
- `google_query_modifications` (TEXT): Q20 - Number of query modifications (0,1,2,3,4,5+)
- `attention_check` (INTEGER 1-7): Q21 - Attention check question
- `google_open_feedback` (TEXT): Q22 - Optional open feedback about Google experience

#### Preserved Fields:
- `task_duration` (TEXT): Q27 - Task completion time
- `search_tool_type` (TEXT): Q28 - Type of search tool used

### 2. Tracking Service Updates
- **File**: `src/lib/tracking.ts`
- **Function**: `trackPostTaskSurvey()`
- **Changes**: Updated field mapping to match new schema and frontend form names

#### Field Mapping Updates:
```typescript
// OLD FIELDS (removed)
interface_familiarity, interface_confidence, search_satisfaction, 
information_efficiency, interface_ease_of_use, interface_usefulness,
decision_support, interface_learnability, interface_reuse_likelihood,
price_range, search_enjoyment, decision_factors, smartphone_model, purchase_likelihood

// NEW FIELDS (added)
google_satisfaction, google_ease, google_relevance, google_trust,
google_query_modifications, attention_check, google_open_feedback,
task_duration, search_tool_type
```

### 3. TypeScript Types Updates  
- **File**: `src/integrations/supabase/types.ts`
- **Updates**: Updated `post_survey` table types to match new schema
- **Purpose**: Ensure type safety and IntelliSense support for new fields

## Migration Status
- ✅ Migration file created
- ⚠️  Migration needs to be applied to remote Supabase database
- ✅ Frontend tracking service updated
- ✅ TypeScript types updated

## Next Steps
1. Apply the migration to the remote Supabase database via:
   - Supabase Dashboard SQL Editor, or
   - `npx supabase db push` (with proper authentication)
2. Verify the new schema in production
3. Test end-to-end data flow from frontend to database

## Data Compatibility
- **Breaking Change**: The new schema is incompatible with old survey responses
- **Recommendation**: Archive old data before applying migration if needed
- **Impact**: Existing post_survey data will be lost when table is recreated

## Validation
After migration, verify:
- [ ] Form submission works without errors
- [ ] Data is correctly stored in new fields
- [ ] TypeScript types are recognized
- [ ] All 9 fields are properly captured and stored
