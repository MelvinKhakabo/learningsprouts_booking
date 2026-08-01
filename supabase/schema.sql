-- Learning Sprouts Programs — reference schema
-- This mirrors what is ACTUALLY LIVE in Supabase as of the end of Phase 1.
-- It's for reference/onboarding only — do not re-run against the live DB.

-- programs ---------------------------------------------------------------
create table programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'ai-coding' | 'public-speaking'
  name text not null,
  description text
);

-- tracks -------------------------------------------------------------------
-- NOTE: delivery lives on cohorts/pricing_packages, NOT here — a track like
-- "Middle Lab" can have both in-person and online cohorts.
create table tracks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  name text not null,
  age_min int not null,
  age_max int not null,
  big_idea text,
  final_outcome text
);

-- cohorts --------------------------------------------------------------------
-- Two models coexist here, distinguished by cycle_length:
--   - Term-based (Public Speaking): cycle_length is NULL, term_label is a
--     fixed range like "Aug–Nov 2026 Term".
--   - Rolling (AI/Coding): cycle_length is set (5), term_label is
--     descriptive ("Rolling enrollment — 5-Saturday cycles"), and
--     paused_months lists months the cycle skips (e.g. 'December').
--     Actual cycle date ranges are computed in the frontend from
--     start_date + cycle_length + paused_months, not stored as rows.
create table cohorts (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) on delete cascade,
  delivery text not null check (delivery in ('in_person', 'online')),
  term_label text not null,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  start_date date not null,
  min_enrollment int not null default 4,
  status text not null default 'open' check (status in ('open', 'filling', 'confirmed', 'closed')),
  cycle_length int,               -- classes per rolling cycle; null = term-based
  paused_months text,             -- e.g. 'December'; null = no pause
  office_hours_day text,
  office_hours_start text,
  office_hours_end text
);

-- pricing_packages -----------------------------------------------------------
create table pricing_packages (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) on delete cascade,
  delivery text not null check (delivery in ('in_person', 'online')),
  class_count int not null,       -- 1, 4, 5, or 8 depending on track
  price numeric not null,
  currency text not null check (currency in ('KSH', 'USD'))
);

-- registrations ----------------------------------------------------------
-- Renamed from "enrollments" to match PUMaC's naming convention.
-- term_label/cycle_number/session_dates are a SNAPSHOT of what the student
-- actually signed up for at registration time — not recomputed later, so
-- the record stays accurate even if cohort scheduling logic changes.
create table registrations (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id),
  package_id uuid references pricing_packages(id),
  student_name text not null,
  student_age int not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'confirmed', 'failed')),
  paystack_reference text,
  created_at timestamptz not null default now(),
  term_label text,                -- e.g. "Aug–Nov 2026 Term" or "Cycle 2: Oct 3 – Oct 31, 2026"
  cycle_number int,                -- AI/Coding only; null for Public Speaking
  session_dates date[]             -- exact class dates this registration covers
);

-- championship_settings -------------------------------------------------------
-- Only the volatile, year-to-year details. Fixed rules (round formats,
-- judging rubric, awards categories, eligibility) live as static content
-- in the frontend, not here — they rarely change and don't map cleanly
-- to flat columns.
create table championship_settings (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  theme text,
  event_date date,
  venue text,
  registration_status text not null default 'not_open' check (registration_status in ('not_open', 'open', 'closed'))
);

-- Row-level security --------------------------------------------------------
alter table programs enable row level security;
alter table tracks enable row level security;
alter table cohorts enable row level security;
alter table pricing_packages enable row level security;
alter table registrations enable row level security;
alter table championship_settings enable row level security;

create policy "public read programs" on programs for select using (true);
create policy "public read tracks" on tracks for select using (true);
create policy "public read cohorts" on cohorts for select using (true);
create policy "public read pricing" on pricing_packages for select using (true);
create policy "public read championship settings" on championship_settings for select using (true);

-- Public can INSERT a registration (the form) but never read them back —
-- payment verification + status updates happen server-side via a
-- service-role Edge Function.
create policy "public can register" on registrations for insert with check (true);
