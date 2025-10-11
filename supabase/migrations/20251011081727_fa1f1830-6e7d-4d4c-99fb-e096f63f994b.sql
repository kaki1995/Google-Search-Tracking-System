-- Fix the attention check constraint to allow NULL values
-- This allows the survey to be submitted even if the attention check wasn't answered
ALTER TABLE post_task_survey 
DROP CONSTRAINT IF EXISTS post_task_survey_q22_attention_check_check;

-- Add updated constraint that allows NULL but validates non-NULL values
ALTER TABLE post_task_survey
ADD CONSTRAINT post_task_survey_q38_attention_check_check 
CHECK (q38_attention_check IS NULL OR (q38_attention_check >= 1 AND q38_attention_check <= 7));

-- Also update other Likert scale constraints to allow NULL
ALTER TABLE post_task_survey 
DROP CONSTRAINT IF EXISTS post_task_survey_q19_task_easy_check;

ALTER TABLE post_task_survey
ADD CONSTRAINT post_task_survey_q19_task_easy_check 
CHECK (q19_task_easy IS NULL OR (q19_task_easy >= 1 AND q19_task_easy <= 7));

ALTER TABLE post_task_survey 
DROP CONSTRAINT IF EXISTS post_task_survey_q20_task_quick_check;

ALTER TABLE post_task_survey
ADD CONSTRAINT post_task_survey_q20_task_quick_check 
CHECK (q20_task_quick IS NULL OR (q20_task_quick >= 1 AND q20_task_quick <= 7));

ALTER TABLE post_task_survey 
DROP CONSTRAINT IF EXISTS post_task_survey_q40_purchase_likelihood_check;

ALTER TABLE post_task_survey
ADD CONSTRAINT post_task_survey_q40_purchase_likelihood_check 
CHECK (q40_purchase_likelihood IS NULL OR (q40_purchase_likelihood >= 1 AND q40_purchase_likelihood <= 7));