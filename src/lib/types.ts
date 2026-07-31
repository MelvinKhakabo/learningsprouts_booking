// Mirrors the Supabase schema proposed for the programs site.
// Keep in sync with the SQL in /supabase/schema.sql once that's finalized.

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
  delivery: 'in_person' | 'online';
  big_idea: string | null;
  final_outcome: string | null;
};

export type Cohort = {
  id: string;
  track_id: string;
  term_label: string; // e.g. "Aug–Nov 2026"
  day_of_week: string; // e.g. "Saturday"
  start_time: string; // e.g. "12:00"
  end_time: string; // e.g. "13:30"
  start_date: string; // ISO date
  min_enrollment: number;
  status: 'open' | 'filling' | 'confirmed' | 'closed';
  office_hours_day: string | null;
  office_hours_start: string | null;
  office_hours_end: string | null;
};

export type PricingPackage = {
  id: string;
  track_id: string;
  class_count: number; // 1, 4, 6, or 8
  price: number;
  currency: 'KSH' | 'USD';
};

export type Enrollment = {
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
};
