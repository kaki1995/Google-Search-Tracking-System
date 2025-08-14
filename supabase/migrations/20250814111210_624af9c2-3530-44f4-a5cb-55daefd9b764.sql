-- Extension for UUID generation
create extension if not exists pgcrypto;

-- Participants table (ensure exists; keep name if already exists)
create table if not exists public.participants (
  participant_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ip_address inet null,
  device_type text null
);

-- Add participant_id and session_duration_ms to search_sessions if they don't exist
alter table if exists public.search_sessions
  add column if not exists participant_id uuid,
  add column if not exists session_duration_ms bigint;

-- Add foreign key constraint to participants (if column exists)
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name = 'search_sessions' and column_name = 'participant_id') then
    -- Try to add constraint, ignore if it already exists
    begin
      alter table public.search_sessions
        add constraint search_sessions_participant_fk
        foreign key (participant_id) references public.participants(participant_id) on delete cascade;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

-- Add query_duration_ms to queries table
alter table if exists public.queries
  add column if not exists query_duration_ms bigint;

-- Backfill query_duration_ms from existing data
update public.queries
set query_duration_ms = case
  when start_time is not null and end_time is not null
  then greatest(0, (extract(epoch from (end_time - start_time))*1000)::bigint)
  else null end
where query_duration_ms is null and start_time is not null and end_time is not null;

-- Session timing audit table
create table if not exists public.session_timing (
  id uuid not null default gen_random_uuid(),
  participant_id uuid not null references public.participants(participant_id) on delete cascade,
  session_start_time timestamptz not null default now(),
  session_end_time timestamptz null,
  session_duration_ms bigint null,
  record_created_at timestamptz not null default now(),
  constraint session_timing_pkey primary key (id)
);

-- Search-Result-Log table for Q11-Q15
create table if not exists public.search_result_log (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(participant_id) on delete cascade,
  session_id uuid not null references public.search_sessions(id) on delete cascade,
  q11_answer text null,
  q12_answer text null,
  q13_answer text null,
  q14_answer text null,
  q15_answer text null,
  created_at timestamptz not null default now(),
  ip_address inet null,
  device_type text null
);

-- Create index for performance
create index if not exists idx_srl_session on public.search_result_log(session_id);

-- Ensure scroll_events table exists
create table if not exists public.scroll_events (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null references public.search_sessions(id) on delete cascade,
  path text not null,
  max_scroll_pct integer not null,
  recorded_at timestamptz not null default now(),
  ip_address inet null,
  device_type text null,
  constraint scroll_events_pkey primary key (id)
);

-- Triggers for duration calculations

-- Function to set session_duration_ms
create or replace function public.trg_set_session_duration_ms()
returns trigger language plpgsql as $$
begin
  if (new.session_end_time is not null and new.session_start_time is not null) then
    new.session_duration_ms := greatest(0, (extract(epoch from (new.session_end_time - new.session_start_time))*1000)::bigint);
  end if;
  return new;
end$$;

-- Trigger for search_sessions duration
drop trigger if exists trg_search_sessions_duration on public.search_sessions;
create trigger trg_search_sessions_duration
before insert or update of session_start_time, session_end_time on public.search_sessions
for each row execute function public.trg_set_session_duration_ms();

-- Function to set query_duration_ms 
create or replace function public.trg_set_query_duration_ms()
returns trigger language plpgsql as $$
begin
  if (new.end_time is not null and new.start_time is not null) then
    new.query_duration_ms := greatest(0, (extract(epoch from (new.end_time - new.start_time))*1000)::bigint);
  end if;
  return new;
end$$;

-- Trigger for queries duration in milliseconds
drop trigger if exists trg_queries_duration_ms on public.queries;
create trigger trg_queries_duration_ms
before insert or update of start_time, end_time on public.queries
for each row execute function public.trg_set_query_duration_ms();

-- Partial unique index: at most ONE active session per participant
-- (Active session = session_end_time IS NULL)
create unique index if not exists ux_active_session_per_participant
  on public.search_sessions (participant_id)
  where session_end_time is null;