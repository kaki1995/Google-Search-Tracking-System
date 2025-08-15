# Manual Edge Function Deployment Guide

Since automatic deployment is encountering authentication issues, please deploy the Edge Functions manually through the Supabase Dashboard:

## Step 1: Deploy save-responses Function

1. Go to: https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms/functions
2. Click "Create a new function"
3. Function name: `save-responses`
4. Copy the content from: `supabase/functions/save-responses/index.ts`
5. Click "Deploy function"

## Step 2: Deploy load-responses Function

1. In the same Functions page, click "Create a new function"
2. Function name: `load-responses`
3. Copy the content from: `supabase/functions/load-responses/index.ts`
4. Click "Deploy function"

## Step 3: Test the Functions

1. Go to the Functions page in your dashboard
2. Test each function with sample data:

### Test save-responses:
```json
{
  "participant_id": "test-uuid-123",
  "page_id": "background_survey",
  "response_data": {
    "age": "25-34",
    "gender": "female"
  }
}
```

### Test load-responses:
```json
{
  "participant_id": "test-uuid-123",
  "page_id": "background_survey"
}
```

## Step 4: Run Database Migration

1. Go to: https://supabase.com/dashboard/project/mmccbfzxoktcjvfhmhms/editor
2. Copy and run the SQL from: `response_persistence_migration.sql`
3. Verify tables were created successfully

## Alternative: Use Existing Infrastructure

If Edge Function deployment is not available, the response persistence system will fall back to localStorage only, which still provides the core functionality.
