-- Add column to track user consent and exit behavior on welcome page
ALTER TABLE public.sessions 
ADD COLUMN welcome_page_action text CHECK (welcome_page_action IN ('consented', 'exited', 'in_progress', NULL));

-- Add comment to explain the column
COMMENT ON COLUMN public.sessions.welcome_page_action IS 'Tracks user action on welcome page: consented (user gave consent), exited (user left without consent), in_progress (user is still on page), NULL (not recorded)';

-- Add index for performance on queries filtering by this column
CREATE INDEX idx_sessions_welcome_page_action ON public.sessions(welcome_page_action);