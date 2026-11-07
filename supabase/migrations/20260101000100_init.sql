-- BizWise AI: core schema
-- Apply to a Supabase project with `supabase db push` or by pasting into the SQL editor.
-- Every user-owned table carries a `user_id` column so ownership checks stay cheap and explicit.

-- ---------------------------------------------------------------------------
-- businesses: exactly one per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_user_id_unique unique (user_id),
  constraint businesses_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint businesses_currency_format check (currency ~ '^[A-Z]{3}$')
);

comment on table public.businesses is 'One business profile per authenticated user.';

-- ---------------------------------------------------------------------------
-- financial_entries: the numbers the owner records per period
-- ---------------------------------------------------------------------------
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  period_label text not null,
  revenue numeric(14, 2) not null,
  cogs numeric(14, 2) not null default 0,
  operating_expenses numeric(14, 2) not null default 0,
  cash_on_hand numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_entries_period_label_length check (char_length(btrim(period_label)) between 1 and 60),
  constraint financial_entries_revenue_non_negative check (revenue >= 0),
  constraint financial_entries_cogs_non_negative check (cogs >= 0),
  constraint financial_entries_opex_non_negative check (operating_expenses >= 0),
  constraint financial_entries_cash_non_negative check (cash_on_hand >= 0),
  constraint financial_entries_notes_length check (notes is null or char_length(notes) <= 500)
);

comment on table public.financial_entries is 'Period financial snapshots recorded by a business owner.';

-- ---------------------------------------------------------------------------
-- simulations: saved what-if scenarios
-- ---------------------------------------------------------------------------
create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  inputs jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now(),
  constraint simulations_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint simulations_inputs_object check (jsonb_typeof(inputs) = 'object'),
  constraint simulations_results_object check (jsonb_typeof(results) = 'object')
);

comment on table public.simulations is 'Saved what-if scenarios computed server-side from the latest entry.';

-- ---------------------------------------------------------------------------
-- chat_messages: AI advisor conversation history
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint chat_messages_role_valid check (role in ('user', 'assistant')),
  constraint chat_messages_content_length check (char_length(content) between 1 and 8000)
);

comment on table public.chat_messages is 'Advisor conversation turns; ordered by seq so pairs stay stable.';

-- ---------------------------------------------------------------------------
-- Indexes that match the app's read patterns
-- ---------------------------------------------------------------------------
create index if not exists businesses_user_id_idx on public.businesses (user_id);

create index if not exists financial_entries_business_created_idx
  on public.financial_entries (business_id, created_at desc);
create index if not exists financial_entries_user_idx
  on public.financial_entries (user_id);

create index if not exists simulations_business_created_idx
  on public.simulations (business_id, created_at desc);
create index if not exists simulations_user_idx
  on public.simulations (user_id);

create index if not exists chat_messages_business_seq_idx
  on public.chat_messages (business_id, seq);
create index if not exists chat_messages_user_idx
  on public.chat_messages (user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon, authenticated;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

drop trigger if exists financial_entries_set_updated_at on public.financial_entries;
create trigger financial_entries_set_updated_at
  before update on public.financial_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bootstrap a business row for every new account
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_name text;
begin
  v_name := btrim(coalesce(new.raw_user_meta_data ->> 'business_name', ''));

  if v_name = '' then
    v_name := split_part(coalesce(nullif(new.email, ''), 'My Business'), '@', 1);
  end if;

  insert into public.businesses (user_id, name)
  values (new.id, left(v_name, 120))
  on conflict (user_id) do nothing;

  return new;
end;
$fn$;

-- Trigger-only function: never callable through the REST API.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
