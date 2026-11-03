---
name: Supabase migration
description: Details of Gyara's localStorage→Supabase Auth+DB migration; patterns to follow for future work
---

# Supabase Migration — Gyara

## What was done
- `src/lib/supabase.ts` — singleton Supabase client (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
- `customer-context.tsx` — Supabase Auth; all mutations return `Promise<string | null>` (null = success).
- `artisans-context.tsx` — all data from Supabase; mutations are async; snake_case DB ↔ camelCase TS via mapper functions.
- `supabase/schema.sql` — full schema, RLS, trigger, and seed SQL (user must run in Supabase SQL editor).

## Key patterns
- `VERIFY_EMAIL_SENTINEL = "verify_email"` exported from supabase.ts; callers check for this before treating the return as an error.
- Profile row is created by a DB trigger on `auth.users` INSERT; `upsert` call in `signup()` is a fallback.
- `savedIds` (bookmarks) kept in localStorage — no auth dependency.
- `rating` stored in artisans table and recomputed from reviews after every `addReview` call.
- RLS: artisans readable by all; insert/update/delete require `owner_customer_id = auth.uid()`.

**Why:** Supabase anon key cannot delete auth users; `deleteCustomer` deletes the profile row and signs out (auth record stays but is unusable).

## Demo seed
- 12 demo artisans with IDs 1–12, reviews with IDs 101–1202 inserted via `OVERRIDING SYSTEM VALUE`.
- Sequences reset to 100 (artisans) / 10000 (reviews) / 1000 (hires) after seed.

## Email confirmation
- Supabase project may have email confirmation ON by default. To skip it during development, disable in Supabase Dashboard → Auth → Email → "Confirm email". Re-enable before going live.

## Schema additions after initial migration
- Appending new SQL to `supabase/schema.sql` does NOT apply it — the user must paste and run it in Supabase SQL Editor each time. There is no direct DDL execution path from the agent (no `DATABASE_URL`/psql access is wired to this Supabase project; PostgREST only serves DML).
- Symptom of a not-yet-applied migration: PostgREST error `Could not find the table 'public.<table>' in the schema cache` (or `column ... does not exist`) even though the SQL file looks correct — verify with a direct REST GET against the table/column before assuming a schema-cache staleness issue.
- Test DB writes/deletes directly via the Supabase Admin REST API (service role key) rather than `executeSql`/`checkDatabase` — those target Replit's own Postgres, which is unprovisioned for this project.
