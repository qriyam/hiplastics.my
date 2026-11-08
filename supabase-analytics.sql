-- Hiplastics analytics add-on. Run after supabase-setup.sql in the same project.
-- Stores one row per anonymous browser visitor per Malaysia calendar day.
create table if not exists hiplastics.visitor_daily (
  visitor_id text not null,
  visit_date date not null,
  page_count int not null default 1,
  last_path text not null default '/',
  user_id uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (visitor_id, visit_date)
);
create index if not exists hip_visitor_daily_date_idx on hiplastics.visitor_daily (visit_date desc);
create index if not exists hip_visitor_daily_user_idx on hiplastics.visitor_daily (user_id);
revoke all on hiplastics.visitor_daily from anon, authenticated;
grant all on hiplastics.visitor_daily to service_role;

create table if not exists hiplastics.visitor_page_daily (
  visitor_id text not null,
  visit_date date not null,
  path text not null,
  page_count int not null default 1,
  last_seen_at timestamptz not null default now(),
  primary key (visitor_id, visit_date, path)
);
create index if not exists hip_visitor_page_daily_date_idx on hiplastics.visitor_page_daily (visit_date desc, page_count desc);
revoke all on hiplastics.visitor_page_daily from anon, authenticated;
grant all on hiplastics.visitor_page_daily to service_role;

create or replace function hiplastics.record_visit(p_visitor_id text, p_path text, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = hiplastics, public
as $$
declare
  malaysia_today date := (timezone('Asia/Kuala_Lumpur', now()))::date;
begin
  insert into hiplastics.visitor_daily (visitor_id, visit_date, page_count, last_path, user_id, first_seen_at, last_seen_at)
  values (left(p_visitor_id, 100), malaysia_today, 1, left(p_path, 300), p_user_id, now(), now())
  on conflict (visitor_id, visit_date) do update set
    page_count = hiplastics.visitor_daily.page_count + 1,
    last_path = excluded.last_path,
    user_id = coalesce(excluded.user_id, hiplastics.visitor_daily.user_id),
    last_seen_at = now();

  insert into hiplastics.visitor_page_daily (visitor_id, visit_date, path, page_count, last_seen_at)
  values (left(p_visitor_id, 100), malaysia_today, left(p_path, 300), 1, now())
  on conflict (visitor_id, visit_date, path) do update set
    page_count = hiplastics.visitor_page_daily.page_count + 1,
    last_seen_at = now();
end;
$$;
revoke all on function hiplastics.record_visit(text, text, uuid) from public, anon, authenticated;
grant execute on function hiplastics.record_visit(text, text, uuid) to service_role;
