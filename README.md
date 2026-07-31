# Learning Sprouts Programs Site

Registration site for Learning Sprouts' year-round programs (AI & Coding,
Public Speaking). Replaces the old `officehours.learningsprouts.school`
1:1 instructor booking tool — this is being rebuilt from scratch as a
program/cohort registration site, deployed to
`programs.learningsprouts.school`.

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

## Project structure

```
src/
  pages/        Home, AiCoding, PublicSpeaking, Register — one per route
  components/   Shared UI (Navbar, Footer, Card, PricingTable, etc.)
  lib/
    supabase.ts Public Supabase client (anon key only — RLS-gated)
    types.ts    Shared types mirroring the Supabase schema
supabase/
  schema.sql    Reference schema — run in the Supabase SQL editor
```

## Build phases

- [x] **Phase 0** — Vite scaffold, routing, Supabase client, env template
- [ ] **Phase 1** — Supabase schema live (drop old tables, create new ones, seed data)
- [ ] **Phase 2** — Shared design system + site shell
- [ ] **Phase 3** — Static content pages wired to live Supabase data
- [ ] **Phase 4** — Registration form + Paystack checkout + server-side verification
- [ ] **Phase 5** — Resend confirmation emails via Edge Function
- [ ] **Phase 6** — QA, mobile pass, domain cutover
- [ ] **Phase 7** — Admin enrollment view (post-launch, optional)

## Security note

The Supabase **service role key**, the Paystack **secret key**, and the
**Resend API key** must never appear in this repo or in any `VITE_*` env
var — those only belong in Supabase Edge Function secrets. Anything that
verifies a payment or sends an email runs server-side in an Edge Function,
not in the browser.
