// Mirrors what is ACTUALLY LIVE in Supabase as of the end of Phase 1.
// Keep in sync with supabase/schema.sql.

export type Program = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type Track = {
  id: string;
  program_id: string;
  name: string;
  age_min: number;
  age_max: number;
  big_idea: string | null;
  final_outcome: string | null;
};

export type Delivery = 'in_person' | 'online';

export type Cohort = {
  id: string;
  track_id: string;
  delivery: Delivery;
  term_label: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  start_date: string; // ISO date — for rolling cohorts, this is the series anchor date
  min_enrollment: number;
  status: 'open' | 'filling' | 'confirmed' | 'closed';
  cycle_length: number | null; // set for rolling (AI/Coding) cohorts, null for term-based
  paused_months: string | null; // e.g. 'December'
  office_hours_day: string | null;
  office_hours_start: string | null;
  office_hours_end: string | null;
};

export type PricingPackage = {
  id: string;
  track_id: string;
  delivery: Delivery;
  class_count: number; // 1, 4, 5 (AI/Coding) or 1, 4, 8 (Public Speaking)
  price: number;
  currency: 'KSH' | 'USD';
};

export type Registration = {
  id: string;
  cohort_id: string;
  package_id: string;
  student_name: string;
  student_age: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  payment_status: 'pending' | 'confirmed' | 'failed';
  paystack_reference: string | null;
  created_at: string;
  term_label: string | null; // snapshot at registration time
  cycle_number: number | null; // AI/Coding only
  session_dates: string[] | null; // exact class dates covered by this registration
};

export type ChampionshipSettings = {
  id: string;
  year: number;
  theme: string | null;
  event_date: string | null;
  venue: string | null;
  registration_status: 'not_open' | 'open' | 'closed';
};

// Helper: computes upcoming rolling cycles for an AI/Coding cohort.
// Not stored in the DB — calculated on demand from the cohort's anchor data.
export type CycleWindow = {
  cycleNumber: number;
  startDate: string; // ISO date of first session
  sessionDates: string[]; // ISO dates, length === cohort.cycle_length
};
