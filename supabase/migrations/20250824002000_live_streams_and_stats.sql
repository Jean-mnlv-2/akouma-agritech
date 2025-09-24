-- Live streams
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructor text,
  scheduled_time timestamptz,
  duration_minutes integer,
  viewers integer default 0,
  is_live boolean default false,
  description text,
  category text,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

alter table public.live_streams enable row level security;

-- Public can read live streams
drop policy if exists "Public can read live_streams" on public.live_streams;
create policy "Public can read live_streams"
  on public.live_streams
  for select
  using (true);

-- Admin can manage live streams
drop policy if exists "Admins manage live_streams" on public.live_streams;
create policy "Admins manage live_streams"
  on public.live_streams
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- E-learning stats
create table if not exists public.elearning_stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  icon text,
  created_at timestamptz not null default now()
);

alter table public.elearning_stats enable row level security;

drop policy if exists "Public can read elearning_stats" on public.elearning_stats;
create policy "Public can read elearning_stats"
  on public.elearning_stats
  for select
  using (true);

drop policy if exists "Admins manage elearning_stats" on public.elearning_stats;
create policy "Admins manage elearning_stats"
  on public.elearning_stats
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
