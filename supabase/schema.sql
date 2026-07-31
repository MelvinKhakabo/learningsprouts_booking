-- Learning Sprouts Programs — reference schema
-- Run manually in the Supabase SQL editor when starting Phase 1.
-- This file is NOT executed automatically by the app.

-- 1. Drop the old office-hours booking tables ------------------------------
drop table if exists bookings;
drop table if exists availabilities;
drop table if exists persons;

-- 2. New schema --------------------------------------------------------------

create table programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'ai-coding' | 'public-speaking'
  name text not null,
  description text
);

create table tracks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  name text not null,                 -- 'Scratch', 'Junior Lab', etc.
  age_min int not null,
  age_max int not null,
  delivery text not null check (delivery in ('in_person', 'online')),
  big_idea text,
  final_outcome text
);

create table cohorts (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) on delete cascade,
  term_label text not null,           -- 'Aug–Nov 2026'
  day_of_week text not null,          -- 'Saturday'
  start_time text not null,           -- '12:00'
  end_time text not null,             -- '13:30'
  start_date date not null,
  min_enrollment int not null default 4,
  status text not null default 'open' check (status in ('open', 'filling', 'confirmed', 'closed')),
  office_hours_day text,
  office_hours_start text,
  office_hours_end text
);

create table pricing_packages (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) on delete cascade,
  class_count int not null,           -- 1, 4, 6, or 8
  price numeric not null,
  currency text not null check (currency in ('KSH', 'USD'))
);

create table enrollments (
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
  created_at timestamptz not null default now()
);

-- 3. Row-level security --------------------------------------------------------

alter table programs enable row level security;
alter table tracks enable row level security;
alter table cohorts enable row level security;
alter table pricing_packages enable row level security;
alter table enrollments enable row level security;

-- Public (anon) can read program/track/cohort/pricing content
create policy "public read programs" on programs for select using (true);
create policy "public read tracks" on tracks for select using (true);
create policy "public read cohorts" on cohorts for select using (true);
create policy "public read pricing" on pricing_packages for select using (true);

-- Public can INSERT an enrollment (registration form) but never read them back —
-- payment verification + status updates happen server-side via a service-role
-- Edge Function, not the anon client.
create policy "public can register" on enrollments for insert with check (true);
