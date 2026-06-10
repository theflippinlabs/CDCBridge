-- ────────────────────────────────────────────────────────────────────────
-- VaultBridge — initial schema
-- Tables: profiles, wallets, nfts, withdrawal_batches,
--         withdrawal_batch_items, audit_logs
-- Security: Row Level Security on every table. Users can only access their
--           own rows. audit_logs are append-only (no update/delete).
-- ────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type nft_status as enum (
    'stored_on_crypto_com',
    'queued_for_withdrawal',
    'withdrawal_started',
    'waiting_email_confirmation',
    'waiting_2fa',
    'submitted',
    'pending_onchain',
    'completed',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type batch_status as enum ('draft', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ── shared updated_at trigger ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── wallets ──────────────────────────────────────────────────────────────
create table if not exists public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  chain      text not null default 'cronos',
  address    text not null,
  notes      text,
  is_default boolean not null default false,
  tested     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wallets_user_id_idx on public.wallets (user_id);

drop trigger if exists trg_wallets_updated_at on public.wallets;
create trigger trg_wallets_updated_at before update on public.wallets
  for each row execute function public.set_updated_at();

-- ── nfts ─────────────────────────────────────────────────────────────────
create table if not exists public.nfts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  collection_name       text not null,
  nft_name              text not null,
  edition_number        text,
  token_id              text,
  chain                 text not null default 'cronos',
  marketplace_source    text,
  current_status        nft_status not null default 'stored_on_crypto_com',
  image_url             text,
  crypto_com_nft_url    text,
  destination_wallet_id uuid references public.wallets (id) on delete set null,
  withdrawal_tx_hash    text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists nfts_user_id_idx on public.nfts (user_id);
create index if not exists nfts_status_idx on public.nfts (user_id, current_status);

drop trigger if exists trg_nfts_updated_at on public.nfts;
create trigger trg_nfts_updated_at before update on public.nfts
  for each row execute function public.set_updated_at();

-- ── withdrawal_batches ───────────────────────────────────────────────────
create table if not exists public.withdrawal_batches (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  name                  text not null,
  destination_wallet_id uuid references public.wallets (id) on delete set null,
  status                batch_status not null default 'draft',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists batches_user_id_idx on public.withdrawal_batches (user_id);

drop trigger if exists trg_batches_updated_at on public.withdrawal_batches;
create trigger trg_batches_updated_at before update on public.withdrawal_batches
  for each row execute function public.set_updated_at();

-- ── withdrawal_batch_items ───────────────────────────────────────────────
create table if not exists public.withdrawal_batch_items (
  id         uuid primary key default gen_random_uuid(),
  batch_id   uuid not null references public.withdrawal_batches (id) on delete cascade,
  nft_id     uuid not null references public.nfts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  steps      jsonb not null default '{}'::jsonb,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, nft_id)
);
create index if not exists batch_items_batch_idx on public.withdrawal_batch_items (batch_id);
create index if not exists batch_items_user_idx on public.withdrawal_batch_items (user_id);

drop trigger if exists trg_batch_items_updated_at on public.withdrawal_batch_items;
create trigger trg_batch_items_updated_at before update on public.withdrawal_batch_items
  for each row execute function public.set_updated_at();

-- ── audit_logs (append-only) ─────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════
alter table public.profiles               enable row level security;
alter table public.wallets                enable row level security;
alter table public.nfts                   enable row level security;
alter table public.withdrawal_batches     enable row level security;
alter table public.withdrawal_batch_items enable row level security;
alter table public.audit_logs             enable row level security;

-- profiles: a user sees and edits only their own profile.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);

-- Generic owner policy for the data tables.
drop policy if exists wallets_all on public.wallets;
create policy wallets_all on public.wallets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nfts_all on public.nfts;
create policy nfts_all on public.nfts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists batches_all on public.withdrawal_batches;
create policy batches_all on public.withdrawal_batches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists batch_items_all on public.withdrawal_batch_items;
create policy batch_items_all on public.withdrawal_batch_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- audit_logs: append-only. Users may insert their own rows and read their own
-- rows, but there are NO update or delete policies, so those are forbidden.
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select using (auth.uid() = user_id);
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert with check (auth.uid() = user_id);
