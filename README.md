# Learning Sprouts Programs Site

Registration site for Learning Sprouts' year-round programs (AI & Coding,
Public Speaking). Replaces the old `officehours.learningsprouts.school`
1:1 instructor booking tool — rebuilt as a program/cohort registration
site, deployed to `programs.learningsprouts.school`.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- React Router
- Supabase (Postgres + RLS) for data
- Paystack (inline popup) for payment
- Resend (via Supabase Edge Function) for confirmation emails

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Paystack public keys
npm run dev
```

## Data model notes

- **AI & Coding** (Scratch, Python, AI/ML Basics) runs on **rolling
  5-Saturday cycles**, synced across all 3 tracks to start Aug 29, 2026,
  paused in December. Cycle dates are NOT stored as rows — they're
  computed from `cohorts.start_date` + `cycle_length` + `paused_months`.
  Whatever a student actually registers for gets snapshotted onto their
  `registrations` row (`cycle_number`, `session_dates`) so it stays
  accurate even if scheduling logic changes later.
- **Public Speaking** (Junior/Middle/Senior Lab) runs on a fixed
  **Aug–Nov 2026 term**. Middle and Senior Labs each have both in-person
  and online cohorts; Junior Lab is in-person only.
- **Championship** details are split: fixed rules (round format, judging
  rubric, awards) are static frontend content; only the volatile
  per-year fields (theme, date, venue, registration status) live in
  `championship_settings`.

## Project structure

```
src/
  pages/        Home, AiCoding, PublicSpeaking, Register — one per route
  components/   Shared UI (Navbar, Footer, Card, PricingTable, etc.)
  lib/
    supabase.ts Public Supabase client (anon key only — RLS-gated)
    types.ts    Shared types mirroring the live Supabase schema
supabase/
  schema.sql    Reference schema matching what's live — for onboarding only
```

## Build phases

- [x] **Phase 0** — Vite scaffold, routing, Supabase client, env template
- [x] **Phase 1** — Supabase schema live, seeded, and verified
- [ ] **Phase 2** — Shared design system + site shell
- [ ] **Phase 3** — Static content pages wired to live Supabase data
- [ ] **Phase 4** — Registration form + Paystack checkout + server-side verification
- [ ] **Phase 5** — Resend confirmation emails via Edge Function
- [ ] **Phase 6** — QA, mobile pass, domain cutover
- [ ] **Phase 7** — Admin registration view (post-launch, optional)

## Security note

The Supabase **service role key**, the Paystack **secret key**, and the
**Resend API key** must never appear in this repo or in any `VITE_*` env
var — those only belong in Supabase Edge Function secrets. Anything that
verifies a payment or sends an email runs server-side in an Edge
Function, not in the browser.
