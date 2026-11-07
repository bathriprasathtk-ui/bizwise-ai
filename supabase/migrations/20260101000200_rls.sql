-- BizWise AI: row level security
-- Every public table is owned by a user. Reads and writes are limited to rows whose
-- user_id matches the JWT subject, and related rows must belong to a business the
-- caller owns. The backend uses the service role and additionally scopes every query
-- by the verified user id, so these policies are the second line of defence.

alter table public.businesses enable row level security;
alter table public.financial_entries enable row level security;
alter table public.simulations enable row level security;
alter table public.chat_messages enable row level security;

-- Even the table owner must satisfy policies (service_role still bypasses RLS).
alter table public.businesses force row level security;
alter table public.financial_entries force row level security;
alter table public.simulations force row level security;
alter table public.chat_messages force row level security;

-- Supabase's default privileges grant ALL on new tables in `public` to anon and
-- authenticated. Granting a subset afterwards does not remove that, so revoke first.
revoke all on table public.businesses from anon, authenticated;
revoke all on table public.financial_entries from anon, authenticated;
revoke all on table public.simulations from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;

grant select, insert, update on table public.businesses to authenticated;
grant select, insert, update, delete on table public.financial_entries to authenticated;
grant select, insert, delete on table public.simulations to authenticated;
grant select, insert on table public.chat_messages to authenticated;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
drop policy if exists "businesses_select_own" on public.businesses;
create policy "businesses_select_own"
  on public.businesses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own"
  on public.businesses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "businesses_update_own" on public.businesses;
create policy "businesses_update_own"
  on public.businesses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Deletion happens only through account deletion (cascade).

-- ---------------------------------------------------------------------------
-- financial_entries
-- ---------------------------------------------------------------------------
drop policy if exists "financial_entries_select_own" on public.financial_entries;
create policy "financial_entries_select_own"
  on public.financial_entries
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = financial_entries.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "financial_entries_insert_own" on public.financial_entries;
create policy "financial_entries_insert_own"
  on public.financial_entries
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = financial_entries.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "financial_entries_update_own" on public.financial_entries;
create policy "financial_entries_update_own"
  on public.financial_entries
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = financial_entries.business_id
        and b.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = financial_entries.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "financial_entries_delete_own" on public.financial_entries;
create policy "financial_entries_delete_own"
  on public.financial_entries
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = financial_entries.business_id
        and b.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- simulations
-- ---------------------------------------------------------------------------
drop policy if exists "simulations_select_own" on public.simulations;
create policy "simulations_select_own"
  on public.simulations
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = simulations.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "simulations_insert_own" on public.simulations;
create policy "simulations_insert_own"
  on public.simulations
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = simulations.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "simulations_delete_own" on public.simulations;
create policy "simulations_delete_own"
  on public.simulations
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = simulations.business_id
        and b.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.businesses b
      where b.id = chat_messages.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role in ('user', 'assistant')
    and exists (
      select 1 from public.businesses b
      where b.id = chat_messages.business_id
        and b.user_id = (select auth.uid())
    )
  );

-- Conversation history is append-only for authenticated clients; the backend uses
-- the service role when a user clears their history from Settings.