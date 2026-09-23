-- ============================================================
-- SugarSprint — Initial schema (Technical Architecture spec §5)
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- SPRINT TYPE: ('glucose' | 'walk' | 'med') per corrected v2 spec
create type sprint_type as enum ('glucose', 'walk', 'med');
create type user_role as enum ('patient', 'caregiver');

-- ---------------- Users ----------------
create table users (
  id uuid primary key default gen_random_uuid(),
  phone varchar(20) not null unique,
  name varchar(80),
  role user_role not null default 'patient',
  linked_caregiver_id uuid references users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

-- ---------------- Sprints (30-day goals) ----------------
create table sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  sprint_type sprint_type not null,
  start_date date not null default current_date,
  is_active boolean not null default true
);

create index sprints_user_idx on sprints(user_id, is_active);

-- ---------------- Daily_Logs ----------------
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references sprints(id) on delete cascade,
  log_date date not null default current_date,
  value numeric,                -- glucose mg/dL or minutes (nullable for med)
  media_url varchar(500),       -- EPHEMERAL: deleted right after AI processing
  transcription text,           -- optional Whisper transcription
  created_at timestamp with time zone not null default now(),
  unique (sprint_id, log_date)  -- one completion per day
);

create index daily_logs_sprint_idx on daily_logs(sprint_id, log_date);

-- ---------------- Cheers ----------------
create table cheers (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references daily_logs(id) on delete cascade,
  caregiver_id uuid not null references users(id) on delete cascade,
  emoji_type varchar(8) not null,  -- 👏 ❤️ 🔥
  created_at timestamp with time zone not null default now()
);

create index cheers_log_idx on cheers(log_id);

-- ============================================================
-- RLS — Principle of Least Privilege (Security spec §2)
-- Caregivers can NEVER read raw glucose values or media.
-- ============================================================
alter table users enable row level security;
alter table sprints enable row level security;
alter table daily_logs enable row level security;
alter table cheers enable row level security;

-- Owner reads/writes own rows; caregivers read only what the policy
-- below explicitly exposes (streak status, never raw values).
create policy owner_all_users on users
  for all using (auth.uid() = id);

create policy owner_all_sprints on sprints
  for all using (auth.uid() = user_id);

create policy owner_all_logs on daily_logs
  for all using (
    exists (
      select 1 from sprints s
      where s.id = daily_logs.sprint_id and s.user_id = auth.uid()
    )
  );

-- Caregiver may only INSERT cheers (motivation without nagging);
-- they have no SELECT policy on daily_logs at all.
create policy caregiver_insert_cheers on cheers
  for insert with check (auth.uid() = caregiver_id);

create policy patient_read_cheers on cheers
  for select using (
    exists (
      select 1
      from daily_logs dl
      join sprints s on s.id = dl.sprint_id
      where dl.id = cheers.log_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- Ephemeral media bucket (Security spec §3)
-- Raw images/audio are purged immediately after AI processing.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('sprint-media', 'sprint-media', false, 10485760)
on conflict (id) do nothing;

-- ============================================================
-- Streak helper — fast consecutive-day computation for the API
-- ============================================================
create or replace function consecutive_days(p_sprint_id uuid)
returns int
language sql
stable
as $$
  with ordered as (
    select log_date,
           log_date - (row_number() over (order by log_date))::int as grp
    from daily_logs
    where sprint_id = p_sprint_id
  )
  select coalesce(max(cnt), 0)
  from (
    select count(*) as cnt, grp
    from ordered
    group by grp
  ) t;
$$;
