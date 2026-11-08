-- Hiplastics admin order activity log add-on.
-- Run this once in the connected Supabase SQL Editor.

create table if not exists hiplastics.order_status_audit (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references hiplastics.orders(id) on delete cascade not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text,
  previous_payment_status text,
  new_payment_status text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hip_order_audit_order_idx
  on hiplastics.order_status_audit (order_id, created_at desc);
create index if not exists hip_order_audit_actor_idx
  on hiplastics.order_status_audit (actor_user_id, created_at desc);

grant all on hiplastics.order_status_audit to service_role;
grant select on hiplastics.order_status_audit to authenticated;
alter table hiplastics.order_status_audit enable row level security;
drop policy if exists "admin read order audit" on hiplastics.order_status_audit;
create policy "admin read order audit" on hiplastics.order_status_audit
  for select to authenticated
  using (hiplastics.has_role(auth.uid(), 'admin'));
