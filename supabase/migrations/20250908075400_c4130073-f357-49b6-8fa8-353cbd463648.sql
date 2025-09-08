-- Update task_instruction table to align with new question numbering
-- Rename q10_response to q11_response since task instruction is now Q11

ALTER TABLE public.task_instruction 
RENAME COLUMN q10_response TO q11_response;

-- Add comment to document the change
COMMENT ON COLUMN public.task_instruction.q11_response IS 'Response to question 11: Budget range for laptop purchase';