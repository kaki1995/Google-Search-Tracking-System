-- Update post_task_survey table to accommodate new question structure
ALTER TABLE public.post_task_survey
DROP COLUMN IF EXISTS responses;

-- Add new columns for all Likert-scale questions organized by sections
-- Task Section (3 questions)
ALTER TABLE public.post_task_survey
ADD COLUMN q1_task_easy integer CHECK (q1_task_easy >= 1 AND q1_task_easy <= 7),
ADD COLUMN q2_task_quick integer CHECK (q2_task_quick >= 1 AND q2_task_quick <= 7),
ADD COLUMN q3_task_familiar integer CHECK (q3_task_familiar >= 1 AND q3_task_familiar <= 7),

-- Search Tool Section (11 questions)
ADD COLUMN q4_tool_reliable integer CHECK (q4_tool_reliable >= 1 AND q4_tool_reliable <= 7),
ADD COLUMN q5_tool_practical integer CHECK (q5_tool_practical >= 1 AND q5_tool_practical <= 7),
ADD COLUMN q6_tool_like integer CHECK (q6_tool_like >= 1 AND q6_tool_like <= 7),
ADD COLUMN q7_tool_easy_use integer CHECK (q7_tool_easy_use >= 1 AND q7_tool_easy_use <= 7),
ADD COLUMN q8_tool_clear_interaction integer CHECK (q8_tool_clear_interaction >= 1 AND q8_tool_clear_interaction <= 7),
ADD COLUMN q9_tool_control integer CHECK (q9_tool_control >= 1 AND q9_tool_control <= 7),
ADD COLUMN q10_tool_provides_info integer CHECK (q10_tool_provides_info >= 1 AND q10_tool_provides_info <= 7),
ADD COLUMN q11_tool_helps_complete integer CHECK (q11_tool_helps_complete >= 1 AND q11_tool_helps_complete <= 7),
ADD COLUMN q12_tool_useful integer CHECK (q12_tool_useful >= 1 AND q12_tool_useful <= 7),
ADD COLUMN q13_tool_too_much_info integer CHECK (q13_tool_too_much_info >= 1 AND q13_tool_too_much_info <= 7),
ADD COLUMN q14_tool_hard_focus integer CHECK (q14_tool_hard_focus >= 1 AND q14_tool_hard_focus <= 7),

-- Search Results Section (5 questions)
ADD COLUMN q15_results_accurate integer CHECK (q15_results_accurate >= 1 AND q15_results_accurate <= 7),
ADD COLUMN q16_results_trustworthy integer CHECK (q16_results_trustworthy >= 1 AND q16_results_trustworthy <= 7),
ADD COLUMN q17_results_complete integer CHECK (q17_results_complete >= 1 AND q17_results_complete <= 7),
ADD COLUMN q18_results_relevant integer CHECK (q18_results_relevant >= 1 AND q18_results_relevant <= 7),
ADD COLUMN q19_results_useful integer CHECK (q19_results_useful >= 1 AND q19_results_useful <= 7),

-- Purchase Intention Section (1 question)
ADD COLUMN q20_purchase_likelihood integer CHECK (q20_purchase_likelihood >= 1 AND q20_purchase_likelihood <= 7),

-- Additional Questions
ADD COLUMN q21_contradictory_handling text[],
ADD COLUMN q22_attention_check integer CHECK (q22_attention_check >= 1 AND q22_attention_check <= 7),
ADD COLUMN q23_time_spent text,
ADD COLUMN q24_future_usage_feedback text;

-- Add comment for clarity
COMMENT ON TABLE public.post_task_survey IS 'Post-task survey with Likert-scale questions organized by Task, Search Tool, Search Results, and Purchase Intention sections';