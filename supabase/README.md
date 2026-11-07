# Supabase setup for BizWise AI

## 1. Create the project

1. Create a new Supabase project at <https://supabase.com/dashboard>.
2. Copy the **Project URL**, the **anon / publishable key** and the **service role key**
   from *Project Settings → API*.
3. The anon key belongs in the frontend (`VITE_SUPABASE_ANON_KEY`). The service role key
   belongs **only** in the backend host (Vercel → Backend project → Environment Variables).

## 2. Apply the migrations

Either use the CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

or paste the two files into the SQL editor, in order:

1. `migrations/20260101000100_init.sql` — tables, constraints, indexes, `updated_at`
   triggers, and the `handle_new_user()` signup bootstrap.
2. `migrations/20260101000200_rls.sql` — enables (and forces) row level security and
   creates ownership policies for `businesses`, `financial_entries`, `simulations` and
   `chat_messages`.

Both files are idempotent (`create table if not exists`, `drop policy if exists`), so they
are safe to re-run.

## 3. Auth settings

In *Authentication → Providers → Email*:

- Enable **Email**.
- Keep "Confirm email" on for production. When it is on, sign-up returns no session and the
  app shows a "check your inbox" state until the user confirms.
- Under *Authentication → URL Configuration*, add your deployed URLs and
  `http://localhost:5173` as redirect URLs. Password reset links are sent to
  `<site>/reset-password`, so that path must be allowed.

## 4. Verify

Run the security and performance advisors after applying the schema:

- Dashboard → *Advisors → Security Advisor*: expect **no errors**. The project intentionally
  has no `security definer` function reachable through the API — `handle_new_user()` is a
  trigger function with `execute` revoked from `public`, `anon` and `authenticated`.
- Dashboard → *Advisors → Performance Advisor*: the composite indexes on
  `(business_id, created_at)` and `(business_id, seq)` cover the app's queries.

Quick RLS smoke test with two accounts:

```sql
-- signed in as user A, this must return only A's rows
select * from public.financial_entries;
-- this must fail (0 rows updated) for a row owned by user B
update public.financial_entries set revenue = 1 where id = '<user B entry id>';
```

## Notes

- `businesses.user_id` is unique, so each account owns exactly one business row. It is
  created automatically by the `on_auth_user_created` trigger; the backend also creates it
  lazily if the trigger was not installed.
- `chat_messages.seq` gives deterministic conversation ordering.
- No table is readable by `anon`; the API and the app always require a signed-in user.
