create table if not exists public.elearning_enrollments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  country text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.elearning_enrollments enable row level security;

-- Public can insert
drop policy if exists "Public can insert enrollments" on public.elearning_enrollments;
create policy "Public can insert enrollments"
  on public.elearning_enrollments
  for insert
  with check (true);

-- Admin can view all
drop policy if exists "Admins can view enrollments" on public.elearning_enrollments;
create policy "Admins can view enrollments"
  on public.elearning_enrollments
  for select
  using (public.is_admin(auth.uid()));
