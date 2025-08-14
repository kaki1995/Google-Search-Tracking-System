-- Session-based participant tracking migration
-- Add required extensions and participants table

create extension if not exists pgcrypto;

-- Participants table (ensure exists)
create table if not exists public.participants (
  participant_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Add columns to search_sessions if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'search_sessions' and column_name = 'participant_id') then
    alter table public.search_sessions add column participant_id uuid;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'search_sessions' and column_name = 'session_duration_ms') then
    alter table public.search_sessions add column session_duration_ms bigint;
  end if;
end$$;

-- Add foreign key constraint if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'search_sessions_participant_fk') then
    alter table public.search_sessions
    add constraint search_sessions_participant_fk
    foreign key (participant_id) references public.participants(participant_id) on delete cascade;
  end if;
end$$;

-- Partial unique index: at most ONE active session per participant
-- (Active = session_end_time IS NULL)
create unique index if not exists ux_active_session_per_participant
  on public.search_sessions (participant_id)
  where session_end_time is null;

-- Session duration computation trigger
create or replace function public.trg_set_session_duration_ms()
returns trigger language plpgsql as $$
begin
  if (new.session_end_time is not null and new.session_start_time is not null) then
    new.session_duration_ms := greatest(0, extract(epoch from (new.session_end_time - new.session_start_time))*1000)::bigint;
  end if;
  return new;
end$$;

drop trigger if exists trg_search_sessions_duration on public.search_sessions;
create trigger trg_search_sessions_duration
before insert or update of session_end_time, session_start_time on public.search_sessions
for each row execute function public.trg_set_session_duration_ms();

-- Query duration computation trigger
create or replace function public.trg_set_query_duration_sec()
returns trigger language plpgsql as $$
begin
  if (new.end_time is not null and new.start_time is not null) then
    new.query_duration_sec := greatest(0, extract(epoch from (new.end_time - new.start_time))::int);
  end if;
  return new;
end$$;

drop trigger if exists trg_queries_duration_sec on public.queries;
create trigger trg_queries_duration_sec
before insert or update of start_time, end_time on public.queries
for each row execute function public.trg_set_query_duration_sec();

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

-- Search-Result-Log table (Q11–Q15)
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
  ip_address text null,
  device_type text null
);

create index if not exists idx_srl_session on public.search_result_log(session_id);

-- Scroll events table if it doesn't exist
create table if not exists public.scroll_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.search_sessions(id) on delete cascade,
  path text not null,
  max_scroll_pct integer not null check (max_scroll_pct >= 0 and max_scroll_pct <= 100),
  recorded_at timestamptz not null default now(),
  ip_address text null,
  device_type text null
);

create index if not exists idx_scroll_events_session on public.scroll_events(session_id);

-- Update existing search_sessions to have participant_id if missing
do $$
begin
  if exists (select 1 from public.search_sessions where participant_id is null limit 1) then
    -- Create a default participant for orphaned sessions
    insert into public.participants (participant_id) 
    select gen_random_uuid() 
    where not exists (select 1 from public.participants limit 1);
    
    -- Assign the first participant to orphaned sessions
    update public.search_sessions 
    set participant_id = (select participant_id from public.participants limit 1)
    where participant_id is null;
  end if;
end$$;