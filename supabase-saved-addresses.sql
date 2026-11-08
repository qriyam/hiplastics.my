-- Hiplastics saved customer addresses add-on.
-- Run this once in the connected Supabase SQL Editor.

create table if not exists hiplastics.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null default 'Address',
  full_name text not null,
  phone text not null,
  company text not null default '',
  address1 text not null,
  address2 text not null default '',
  city text not null,
  state text not null,
  postcode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hip_saved_addresses_user_idx
  on hiplastics.saved_addresses (user_id, is_default desc, created_at desc);

grant all on hiplastics.saved_addresses to service_role;
revoke all on hiplastics.saved_addresses from anon, authenticated;
