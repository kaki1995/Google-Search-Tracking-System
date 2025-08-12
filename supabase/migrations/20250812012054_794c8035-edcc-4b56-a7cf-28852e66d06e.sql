-- 1) Create consent_logs table with RLS and FK to participants
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('consent_given','continue_study','exit_study')),
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Add FK and index
DO $$ BEGIN
  ALTER TABLE public.consent_logs
  ADD CONSTRAINT consent_logs_participant_fk
  FOREIGN KEY (participant_id)
  REFERENCES public.participants(participant_id)
  ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_consent_logs_participant_id ON public.consent_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_event_time ON public.consent_logs(event_type, timestamp);

-- Enable RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Strict insert-only with valid participant policy
DO $$ BEGIN
  CREATE POLICY allow_insert_consent_logs_with_valid_participant
  ON public.consent_logs
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.participant_id = consent_logs.participant_id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No select/update/delete policies (disallow by default under RLS)
