-- Adjust backend tables to capture correct question ranges

-- 1. Background survey: Add support for question 10
-- No schema changes needed as it uses jsonb responses column
-- The edge function will be updated to handle q10

-- 2. Search result log: Add columns for questions 16-18 to complete the 12-18 range
ALTER TABLE search_result_log 
ADD COLUMN IF NOT EXISTS q16_answer text,
ADD COLUMN IF NOT EXISTS q17_answer text,
ADD COLUMN IF NOT EXISTS q18_answer text;

-- 3. Post-task survey: Already uses jsonb responses column, no schema changes needed
-- The edge function will be updated to handle questions 19-29 instead of 16-24

-- Update any existing data to reflect new question numbering if needed
-- This is just to document the change - actual data migration would depend on existing data structure