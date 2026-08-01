import { createClient } from '@supabase/supabase-js';

// Public client — safe to use in client components.
// Reads only; RLS policies on each table enforce what the anon key can touch.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// NOTE: there is intentionally no admin/service-role client here.
// Anything requiring the service role key (writing confirmed registrations,
// verifying Paystack transactions, sending Resend emails) belongs in a
// Supabase Edge Function, never in frontend code — the service role key
// must never ship to the browser.
